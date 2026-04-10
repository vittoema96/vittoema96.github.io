import { useEffect, useMemo, useRef, useState } from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { useTranslation } from 'react-i18next';
import { CreatureType, getHitLocationFromRoll, rollD20 } from '@/components/popup/utils/diceUtils.ts';
import { CharacterItem, GenericPopupProps, WeaponItem } from '@/types';
import { getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import Tag from '@/components/Tag.tsx';
import { RollerType, usePopup } from '@/contexts/popup/PopupContext.tsx';
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import DialogPortal from '@/components/popup/common/DialogPortal.tsx';
import PopupHeader from '@/components/popup/common/PopupHeader.tsx';
import useDice from '@/utils/useDice.ts';
import { isCloseCombat } from '@/utils/itemUtils.ts';



const getFaceClass = (value: number | '?') => {
    const classBase = 'd6-face-'
    switch (value) {
        case 1: return classBase + 'damage1'
        case 2: return classBase + 'damage2'
        case 3:
        case 4: return classBase + 'effect'
        case 5:
        case 6: return classBase + 'blank'
        default: return ''
    }
}


interface D6PopupProps extends GenericPopupProps {
    usingItem: CharacterItem;
    hasAimed: boolean;
    roller?: RollerType;
}

function D6Popup({ onClose, usingItem, hasAimed = false, roller = undefined }: Readonly<D6PopupProps>) {
    const { t } = useTranslation();
    const meltdownDialogRef = useRef<HTMLDialogElement>(null);
    const { character, updateCharacter } = useCharacter();
    const { showConfirm } = usePopup();


    // Get weapon data with mods applied
    const weaponData = getModifiedItemData(usingItem) as WeaponItem;

    // Checks on EFFECTS and QUALITIES
    const isGatling = weaponData.QUALITIES.includes('qualityGatling');
    const isAccurate = weaponData.QUALITIES.includes('qualityAccurate');
    const hasBurst = weaponData.EFFECTS.includes('effectBurst');

    const fireRateNum = Number(weaponData.FIRE_RATE) || 0;


    // User-selectable extra hits type for Accurate + Aimed
    const canChooseExtraHitsType = (
        !isCloseCombat(weaponData.CATEGORY) //
        && hasAimed && isAccurate // aiming + accurate allows to roll more damage (PA)
        && fireRateNum > 0
    );

    // Extra dice: AP or AMMO cost?
    const defaultExtraHitType =  isCloseCombat(weaponData.CATEGORY) ? 'ap'
        : fireRateNum > 0 ? 'ammo'
            :(hasAimed && isAccurate) ? 'ap'
                : null;

    const [extraHitTypeChoice, setExtraHitTypeChoice] = useState<'ap' | 'ammo' | null>(null);
    const extraHitsType = canChooseExtraHitsType ? (extraHitTypeChoice ?? defaultExtraHitType) : defaultExtraHitType;



    // Number of Damage dice
    const diceCount = useMemo(() => {

        // TODO should unify logic with WeaponContent
        let rating = weaponData.DAMAGE_RATING;
        if (isCloseCombat(weaponData.CATEGORY)) {
            rating += character.meleeDamage;
        }
        if(weaponData.CATEGORY === "energyWeapons"){
            rating += character.perks.filter(p => p === 'perkLaserCommander').length
        }
        if([
            'weaponCombatRifle', 'weaponAssaultRifle',
            'weaponFragmentationGrenade', 'weaponCombatKnife',
            // TODO all these machine gun types? it says generically "machine guns"
            'weaponMachineGun', 'weaponLightMachineGun', 'weapon50caMachineGun'
        ].includes(weaponData.ID) && character.traits.includes("traitGrunt")){
            rating += 1
        }
        return rating;
    }, [character.meleeDamage, character.perks, character.traits, weaponData.CATEGORY, weaponData.DAMAGE_RATING, weaponData.ID]);

    // Number of Extra dice
    const extraDiceCount = useMemo(() => {
        if (roller) {
            return 0;
        }
        if (isCloseCombat(weaponData.CATEGORY)) {
            return 3; // Melee always has 3 extra dice (AP)
        }
        if (extraHitsType === 'ammo') {
            const triggerDisciplineMalus = ['smallGuns', 'energyWeapons'].includes(weaponData.CATEGORY)
                && character.traits.includes("traitTriggerDiscipline") ? 1 : 0
            return Math.min(0, fireRateNum * (isGatling ? 2 : 1) - triggerDisciplineMalus);
        }
        if (extraHitsType === 'ap') {
            return 3;
        }
        return 0;
    }, [character.traits, extraHitsType, fireRateNum, isGatling, roller, weaponData.CATEGORY])

    // State
    const [hasRolled, setHasRolled] = useState(false);
    const [
        diceValues, setDiceValues,
        diceActive, setDiceActive,
        diceRerolled, setDiceRerolled
    ] = useDice(
        diceCount,
        diceCount,
        roller ? diceCount : 0
    )
    const [
        extraDiceValues, setExtraDiceValues,
        extraDiceActive, setExtraDiceActive,
        extraDiceRerolled, setExtraDiceRerolled
    ] = useDice(
        extraDiceCount,
        0,
        roller ? extraDiceCount : 0 // just in case, not actually needed
    )

    const ammoStep = useMemo(() => {
        // TODO should companion consume ammo?
        if(roller || ["na", undefined, "-"].includes(weaponData.AMMO_TYPE)){
            return 0;
        }
        if(isGatling){
            return 10;
        }
        const ammoHungryQuality = weaponData.QUALITIES.find(q => q.startsWith("qualityAmmoHungry"))
        if(ammoHungryQuality) {
            const [_, qualityOpt] = ammoHungryQuality.split(':');
            return  Number(qualityOpt) || 1;
        }
        return 1;
    }, [isGatling, roller, weaponData.AMMO_TYPE, weaponData.QUALITIES])

    // Reinitialize extra dice arrays when count changes
    useEffect(() => {
        // If switching mode before rolling, reset ammo cost appropriately
        if (!hasRolled && !isCloseCombat(weaponData.CATEGORY)) {
            if (extraHitsType === 'ap') {
                setAmmoCost(ammoStep); // only base shot cost
            } else if (extraHitsType === 'ammo') {
                const activeExtra = 0
                setAmmoCost(ammoStep + activeExtra * ammoStep);
            }
        }
    }, [ammoStep, extraHitsType, hasRolled, weaponData.CATEGORY]);


    const [ammoCost, setAmmoCost] = useState(ammoStep);
    const [targetCreatureType, setTargetCreatureType] = useState<CreatureType>('humanoid');
    const [hitLocationRoll, setHitLocationRoll] = useState(rollD20()); // d20 roll for hit location (1-20)
    const hitLocation = getHitLocationFromRoll(hitLocationRoll, targetCreatureType);

    // States relative to PERKS
    const [burstEffectsUsed, setBurstEffectsUsed] = useState(0); // Number of burst effects activated
    const [gunFuUsed, setGunFuUsed] = useState(false); // Track if Gun Fu has been used
    const [slayerUsed, setSlayerUsed] = useState(false); // Track if Slayer has been used

    const [meltdownUsed, setMeltdownUsed] = useState(false); // Track if Meltdown has been used
    const [meltdownPopupOpen, setMeltdownPopupOpen] = useState(false); // Track if Meltdown popup is open
    const [meltdownDiceValues, setMeltdownDiceValues] = useState<number[]>([]); // Meltdown dice results

    // Meltdown functions
    useEffect(() => {
        if (meltdownPopupOpen && meltdownDialogRef.current) {
            meltdownDialogRef.current.showModal();
        } else if (!meltdownPopupOpen && meltdownDialogRef.current) {
            meltdownDialogRef.current.close();
        }
    }, [meltdownPopupOpen]);
    const getMeltdownDiceCount = () => {
        return Math.floor(diceCount / 2);
    };
    const rollMeltdownDice = () => {
        const diceCount = getMeltdownDiceCount();
        const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setMeltdownDiceValues(rolls);
    };
    const getMeltdownEffectCount = () => {
        return meltdownDiceValues.filter(roll => roll === 3 || roll === 4).length;
    };
    const closeMeltdownPopup = () => {
        setMeltdownPopupOpen(false);
        setMeltdownUsed(true);
        setMeltdownDiceValues([]);
    };

    // Get current ammo count
    const getCurrentAmmo = () => {
        let ammoId = weaponData.AMMO_TYPE;
        if (ammoId === 'self') {
            ammoId = weaponData.ID;
        }
        if (ammoId === 'na') {
            return 0;
        }

        const ammoItem = character.items.find(item => item.id === ammoId);
        return ammoItem ? ammoItem.quantity : 0;
    };

    // Count functions
    const getActiveDiceCount = () => diceActive.filter(Boolean).length;
    const getActiveExtraDiceCount = () => extraDiceActive.filter(Boolean).length;
    const getActiveCount = () => getActiveDiceCount() + getActiveExtraDiceCount();

    const getRerolledDiceCount = () => diceRerolled.filter(Boolean).length;
    const getRerolledExtraDiceCount = () => extraDiceRerolled.filter(Boolean).length;
    const getRerolledCount = () => getRerolledDiceCount() + getRerolledExtraDiceCount();

    // Luck Cost calculation (1 luck per 3 rerolled dice)
    const getLuckCost = () => {
        if (!hasRolled) {
            return 0;
        }

        const rerolledCount = getRerolledCount();
        const payedLeftover = rerolledCount % 3;
        const freeRerolls = payedLeftover > 0 ? 3 - payedLeftover : 0;
        const luckCost = Math.ceil((getActiveCount() - freeRerolls) / 3);

        return Math.max(0, luckCost);
    };


    // Count damage and effects
    const getDamage1Count = () => {
        return [...diceValues, ...extraDiceValues].filter(c => c === 1).length;
    };
    const getDamage2Count = () => {
        return [...diceValues, ...extraDiceValues].filter(c => c === 2).length;
    };
    const getEffectCount = () => {
        return [...diceValues, ...extraDiceValues].filter(c => c === 3 || c === 4).length;
    };

    const getTotalDamage = () => {
        if (!hasRolled) {
            return '?';
        }
        const effects = getEffectCount();
        const damage1 = getDamage1Count();
        const damage2 = getDamage2Count();
        const baseDamage = effects + damage1 + damage2 * 2;
        let result = baseDamage
        let extra = ''
        const hasVicious = weaponData.EFFECTS.includes('effectVicious')
        const hasRadioactive = weaponData.EFFECTS.includes('effectRadioactive')
        if(hasVicious){
            result += effects
            extra += ` (${baseDamage}+${effects})`
        }
        if(hasRadioactive){
            extra += ` +${effects}rads` // TODO ugly UI, improve (ie with FatMan)
        }
        return `${result}${extra}`
    };

    const getTotalEffects = () => {
        if (!hasRolled) {
            return '?';
        }
        return getEffectCount();
    };

    // Handle damage dice click
    const handleDiceClick = (index: number) => {
        // Only toggle if rolled and not already rerolled
        if (hasRolled && !diceRerolled[index]) {
            setDiceActive(prev => {
                const newActive = [...prev];
                newActive[index] = !newActive[index];
                return newActive;
            });
        }
    };

    // Handle extra dice click
    const handleExtraDiceClick = (index: number) => {
        if (!hasRolled) {
            // Before rolling: activate/deactivate extra dice (costs ammo)
            const isActivating = !extraDiceActive[index];

            // Check ammo availability
            let ammoId: string | undefined = weaponData.AMMO_TYPE;
            if (ammoId === 'self') {
                ammoId = weaponData.ID;
            }
            if (ammoId === 'na') {
                ammoId = undefined;
            }

            if (extraHitsType === 'ammo' && isActivating && ammoId) {
                const currentAmmo = character.items.find(item => item.id === ammoId)?.quantity ?? 0;
                if (currentAmmo < ammoCost + ammoStep) {
                    alert(t('notEnoughAmmoAlert'));
                    return;
                }
            }

            setExtraDiceActive(prev => {
                const newActive = [...prev];
                newActive[index] = !newActive[index];

                // Gatling: toggle pairs
                if (isGatling) {
                    const indexOffset = index % 2 === 0 ? 1 : -1;
                    newActive[index + indexOffset] = newActive[index];
                }

                return newActive;
            });

            // Update ammo cost only if extra hits are ammo-based
            if (extraHitsType === 'ammo' && ammoId) {
                setAmmoCost(prev => prev + (isActivating ? 1 : -1) * ammoStep);
            }
        } else if (extraDiceValues[index] !== '?' && !extraDiceRerolled[index]) {
            setExtraDiceActive(prev => {
                const newActive = [...prev];
                newActive[index] = !newActive[index];
                return newActive;
            });
        }
    };

    // Handle roll/reroll
    const handleRoll = () => {
        if (getActiveCount() === 0) {
            alert(t('selectDiceAlert'));
            return;
        }

        const luckCost = getLuckCost();
        if (character.currentLuck < luckCost) {
            alert(t('notEnoughLuckAlert'));
            return;
        }

        // Roll damage dice
        const newValues = [...diceValues];
        const newRerolled = [...diceRerolled];
        diceActive.forEach((isActive, index) => {
            if (isActive) {
                newValues[index] = Math.floor(Math.random() * 6) + 1;
                if (hasRolled) {
                    newRerolled[index] = true;
                }
            }
        });
        setDiceValues(newValues);
        setDiceRerolled(newRerolled);
        setDiceActive(new Array(diceCount).fill(false));

        // Roll extra dice
        const newExtraClasses = [...extraDiceValues];
        const newExtraRerolled = [...extraDiceRerolled];
        extraDiceActive.forEach((isActive, index) => {
            if (isActive) {
                newExtraClasses[index] = Math.floor(Math.random() * 6) + 1;
                if (hasRolled) {
                    newExtraRerolled[index] = true;
                }
            }
        });
        setExtraDiceValues(newExtraClasses);
        setExtraDiceRerolled(newExtraRerolled);
        setExtraDiceActive(new Array(extraDiceCount).fill(false));

        // First roll: consume ammo
        if (!hasRolled) {
            let ammoId = weaponData.AMMO_TYPE;
            if (ammoId === 'self') {
                ammoId = weaponData.ID;
            }
            if (ammoId && ammoId !== 'na') {
                // Only consume base ammo cost on first roll
                updateCharacter({
                    items: character.items
                        .map(item =>
                            item.id === ammoId
                                ? { ...item, quantity: item.quantity - ammoCost }
                                : item,
                        )
                        .filter(item => item.quantity > 0),
                });
                setAmmoCost(0); // Reset cost after consuming
            }
        }

        // Update luck
        if (luckCost > 0) {
            updateCharacter({ currentLuck: character.currentLuck - luckCost });
        }

        setHasRolled(true);
    };

    const handleClose = () => {
        // Consume burst ammo if any were selected
        if (burstEffectsUsed > 0 && weaponData && !isCloseCombat(weaponData.CATEGORY)) {
            let ammoId = weaponData.AMMO_TYPE;
            if (ammoId === 'self') {
                ammoId = weaponData.ID;
            }
            if (ammoId && ammoId !== 'na') {
                updateCharacter({
                    items: character.items
                        .map(item =>
                            item.id === ammoId
                                ? { ...item, quantity: item.quantity - burstEffectsUsed }
                                : item,
                        )
                        .filter(item => item.quantity > 0),
                });
            }
        }
        onClose();
    };


    return (
        <>
            <BasePopup
                title={weaponData.ID}
                onClose={handleClose}
                footerChildren={
                    <>
                        {(!hasRolled || !(diceRerolled.every(Boolean) && extraDiceRerolled.every(Boolean))) && (
                            <button
                                className="confirmButton"
                                onClick={handleRoll}
                                disabled={!isCloseCombat(weaponData.CATEGORY) && getCurrentAmmo() < ammoCost}
                            >
                                {hasRolled ? t('reroll') : t('roll')}
                            </button>
                        )}

                        {/* Gun Fu button - only for ranged weapons when player has the perk */}
                        {!roller &&
                            !isCloseCombat(weaponData.CATEGORY) &&
                            character.perks.includes('perkGunFu') &&
                            !gunFuUsed && (
                                <button
                                    className="confirmButton"
                                    onClick={() => {
                                        const totalDamage = getTotalDamage();

                                        showConfirm(
                                            `${t('perkGunFu')}\n\n` +
                                            `${t('damage')}: ${totalDamage}\n\n` +
                                            `${t('confirmGunFu')}`,
                                            () => {
                                                // Consume 1 ammo
                                                let ammoId = weaponData.AMMO_TYPE;
                                                if (ammoId === 'self') {
                                                    ammoId = weaponData.ID;
                                                } // TODO should "SELF" ammo types use Gun Fu?
                                                if (ammoId && ammoId !== 'na') {
                                                    updateCharacter({
                                                        items: character.items
                                                            .map(item =>
                                                                item.id === ammoId
                                                                    ? { ...item, quantity: item.quantity - 1 }
                                                                    : item,
                                                            )
                                                            .filter(item => item.quantity > 0),
                                                    });
                                                }
                                                // Mark Gun Fu as used
                                                setGunFuUsed(true);
                                            })
                                    }}
                                    disabled={!hasRolled || getCurrentAmmo() < 1}
                                    title={t('perkGunFuDescription')}
                                >
                                    {t('perkGunFu')}
                                </button>
                            )}

                        {/* Slayer button - only for melee/unarmed weapons when player has the perk */}
                        {!roller &&
                            isCloseCombat(weaponData.CATEGORY) &&
                            character.perks.includes('perkSlayer') &&
                            !slayerUsed && (
                                <button
                                    className="confirmButton"
                                    onClick={() => {
                                        showConfirm(
                                            `${t('perkSlayer')}\n\n` +
                                            `${t('confirmSlayer')}`,
                                            () => {
                                                // Spend 1 Luck point
                                                updateCharacter({
                                                    currentLuck: character.currentLuck - 1
                                                });
                                                // Mark Slayer as used
                                                setSlayerUsed(true);
                                            })
                                    }}
                                    disabled={!hasRolled || character.currentLuck < 1}
                                    title={t('perkSlayerDescription')}
                                >
                                    {t('perkSlayer')}
                                </button>
                            )}

                        {/* Meltdown button - only for energy weapons when player has the perk */}
                        {!roller &&
                            weaponData.CATEGORY === 'energyWeapons' &&
                            character.perks.includes('perkMeltdown') &&
                            !meltdownUsed && (
                                <button
                                    className="confirmButton"
                                    onClick={() => {
                                        setMeltdownPopupOpen(true);
                                    }}
                                    disabled={!hasRolled}
                                    title={t('perkMeltdownDescription')}
                                >
                                    {t('perkMeltdown')}
                                </button>
                            )}
                    </>
                }
            >
                <div className="stack no-gap">

                    {/* Damage Type */}
                    <div className="h4">
                        {t('damage')}: {t(weaponData.DAMAGE_TYPE)}
                    </div>

                    {/* Effects and Qualities Tags */}
                    {(weaponData.EFFECTS.length > 0 || weaponData.QUALITIES.length > 0) && (
                        <div
                            className="row l-centered"
                            style={{ flexWrap: 'wrap', gap: '0.25rem'}}
                        >
                            {weaponData.EFFECTS.map(effect => {
                                const [effectType, effectOpt] = effect.split(':');
                                let displayValue = t(effectOpt!);
                                if (displayValue) {
                                    displayValue = ` ${displayValue}`;
                                }
                                const displayText = `${t(effectType!)}${displayValue}`;
                                return (
                                    <Tag key={effect} tooltipId={`${effectType}Description`}>
                                        {displayText}
                                    </Tag>
                                );
                            })}

                            {weaponData.QUALITIES.map(effect => {
                                const [qualityType, qualityOpt] = effect.split(':');
                                let displayValue = t(qualityOpt!);
                                if (displayValue) {
                                    displayValue = ` ${displayValue}`;
                                }
                                const displayText = `${t(qualityType!)}${displayValue}`;
                                return (
                                    <Tag
                                        key={effect}
                                        isEmpty={true}
                                        tooltipId={`${qualityType}Description`}
                                    >
                                        {displayText}
                                    </Tag>
                                );
                            })}
                        </div>
                    )}
                </div>

                <hr style={{ margin: '0.25rem 0' }} />

                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{t('hitLocation')}:</span>
                {/* Hit Location - compact single row */}
                <div className="row" style={{ gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <select
                        value={targetCreatureType}
                        onChange={e => setTargetCreatureType(e.target.value as CreatureType)}
                        style={{
                            padding: '0.125rem 0.25rem',
                            backgroundColor: 'var(--secondary-color)',
                            color: 'var(--primary-color)',
                            border: 'var(--border-primary-thin)',
                            fontSize: '0.85rem',
                            borderRadius: '0.25rem',
                            flex: 1,
                            minWidth: '80px',
                        }}
                    >
                        <option value="humanoid">{t('humanoid')}</option>
                        <option value="mrHandy">{t('mrHandy')}</option>
                    </select>
                    <span
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            minWidth: 0,
                            fontSize: '0.95rem',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                        }}
                    >
                    {t(hitLocation)}
                </span>
                    <button
                        onClick={() => setHitLocationRoll(rollD20())}
                        style={{
                            padding: '0.125rem 0.375rem',
                            backgroundColor: 'var(--secondary-color)',
                            color: 'var(--primary-color)',
                            border: 'var(--border-primary-thin)',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title={t('rerollHitLocation')}
                    >
                        <i className="fas fa-dice"></i>
                    </button>
                </div>

                <hr style={{ margin: '0.25rem 0' }} />

                {/* Dice Section - fixed height container with grid layout */}
                <div style={{ marginBottom: '0.25rem' }}>
                    {/* Damage Dice */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, 2.5rem)',
                            gap: '0.25rem',
                            justifyContent: 'center',
                            minHeight: '2.5rem',
                            marginBottom: extraDiceCount > 0 ? '0.5rem' : '0'
                        }}
                    >
                        {
                            diceValues.map((value, index) => (
                                <D6Die
                                    value={value}
                                    key={index}
                                    isActive={diceActive[index]!}
                                    isRerolled={diceRerolled[index]!}
                                    onClick={() => handleDiceClick(index)}/>
                            ))
                        }
                    </div>

                    {/* Extra Hits */}
                    {extraDiceCount > 0 && (
                        <>
                            <div
                                className="row"
                                style={{
                                    justifyContent: 'space-between',
                                    fontSize: '0.85rem',
                                    marginBottom: '0.25rem'
                                }}
                            >
                                <span>{t('extraHits')}</span>
                                {canChooseExtraHitsType ? (
                                    <select
                                        value={extraHitsType || 'ap'}
                                        onChange={e => setExtraHitTypeChoice(e.target.value as 'ap' | 'ammo')}
                                        disabled={hasRolled}
                                        style={{
                                            padding: '0.125rem 0.25rem',
                                            backgroundColor: 'var(--secondary-color)',
                                            color: 'var(--primary-color)',
                                            border: 'var(--border-primary-thin)',
                                            fontSize: '0.85rem',
                                            borderRadius: '0.25rem',
                                        }}
                                    >
                                        <option value="ap">[{t('ap')}]</option>
                                        <option value="ammo">[{t('ammo')}]</option>
                                    </select>
                                ) : (
                                    <span>[{t(extraHitsType ?? '')}]</span>
                                )}
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, 2.5rem)',
                                    gap: '0.25rem',
                                    justifyContent: 'center',
                                    minHeight: '2.5rem'
                                }}
                            >
                                {extraDiceValues.map((value, index) => (
                                    <D6Die
                                        key={index}
                                        value={value}
                                        isActive={extraDiceActive[index]!}
                                        isRerolled={extraDiceRerolled[index]!}
                                        onClick={() => handleExtraDiceClick(index)}/>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <hr style={{ margin: '0.25rem 0' }} />

                {/* Stats - compact grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem' }}>{t('totalDamage')}</div>
                        <div className="h2" style={{ margin: 0 }}>{getTotalDamage()}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem' }}>{t('totalEffects')}</div>
                        <div className="h2" style={{ margin: 0 }}>{getTotalEffects()}</div>
                    </div>
                </div>

                <hr style={{ margin: '0.25rem 0' }} />

                {!roller && (
                    <>
                        {/* Costs - compact */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isCloseCombat(weaponData.CATEGORY) ? '1fr' : '1fr 1fr',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            marginBottom: '0.25rem'
                        }}>
                            {!isCloseCombat(weaponData.CATEGORY) && (
                                <div className="row" style={{ justifyContent: 'space-between' }}>
                                    <span>{t('ammo')}:</span>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                    {!hasRolled ? (
                                        <span>{ammoCost} / {getCurrentAmmo()}</span>
                                    ) : hasBurst ? (
                                        <>
                                            <select
                                                value={burstEffectsUsed}
                                                onChange={e =>
                                                    setBurstEffectsUsed(parseInt(e.target.value))
                                                }
                                                style={{
                                                    padding: '0.125rem 0.25rem',
                                                    backgroundColor: 'var(--secondary-color)',
                                                    color: 'var(--primary-color)',
                                                    border: 'var(--border-primary-thin)',
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                {Array.from(
                                                    {
                                                        length:
                                                            Math.min(
                                                                getEffectCount(),
                                                                getCurrentAmmo(),
                                                            ) + 1,
                                                    },
                                                    (_, i) => (
                                                        <option key={i} value={i}>
                                                            {i}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <span>/ {getCurrentAmmo()}</span>
                                        </>
                                    ) : (
                                        <span>0 / {getCurrentAmmo()}</span>
                                    )}
                                </span>
                                </div>
                            )}

                            <div className="row" style={{ justifyContent: 'space-between' }}>
                                <span>{t('luck')}:</span>
                                <span>{getLuckCost()} / {character.currentLuck}</span>
                            </div>
                        </div>
                    </>
                )}
            </BasePopup>

            {/* Meltdown Popup - inline dialog for rolling explosion dice */}
            <DialogPortal>
                <dialog
                    ref={meltdownDialogRef}
                    style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        minWidth: '300px',
                        maxWidth: '500px',
                    }}
                >
                    <PopupHeader
                        title={t('meltdownTitle')}
                        onClose={closeMeltdownPopup}
                    />
                    <hr />

                    <div style={{ padding: '1rem 0' }}>
                        <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
                            {t('meltdownRollDice', { diceCount: getMeltdownDiceCount() })}
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'center',
                            marginBottom: '1rem',
                            flexWrap: 'wrap'
                        }}>
                            {Array.from({ length: getMeltdownDiceCount() }, (_, index) => {
                                const roll = meltdownDiceValues[index];
                                const diceClass = roll ? getFaceClass(roll) : null;

                                return (
                                    <div
                                        key={index}
                                        className={`d6-dice dice ${diceClass || ''}`}
                                    >
                                        {diceClass ? '' : '?'}
                                    </div>
                                );
                            })}
                        </div>

                        {meltdownDiceValues.length > 0 && (
                            <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                {t('meltdownResult', {
                                    effectCount: getMeltdownEffectCount(),
                                    totalDamage: getMeltdownEffectCount()
                                })}
                            </p>
                        )}
                    </div>

                    <hr />
                    <footer style={{ padding: 0, marginTop: '0.25rem', gap: '0.5rem' }}>
                        <button
                            className="confirmButton"
                            onClick={meltdownDiceValues.length === 0 ? rollMeltdownDice : closeMeltdownPopup}
                        >
                            {meltdownDiceValues.length === 0 ? t('roll') : t('confirm')}
                        </button>
                        <button
                            className="closeButton"
                            onClick={closeMeltdownPopup}
                        >
                            {t('close')}
                        </button>
                    </footer>
                </dialog>
            </DialogPortal>
        </>
    );
}


export function Dice({ value, displayValue, baseClass, getClassFromValue, isActive, isRerolled, extraStyle, onClick }: Readonly<{
    value: number | '?',
    displayValue?: string,
    baseClass: string,
    getClassFromValue: (index: number | '?') => string,
    isActive: boolean,
    isRerolled: boolean,
    extraStyle?: Record<string, any> | undefined,
    onClick: () => void
}>) {

    return (
        <button
            className={`${baseClass} dice ${getClassFromValue(value)} ${isActive ? 'active' : ''} ${isRerolled ? 'rerolled' : ''}`}
            onClick={onClick}
            style={extraStyle ?? {}}
        >
            {displayValue ?? value}
        </button>
    );
}

function D6Die({ value, isActive, isRerolled, onClick }: Readonly<{
    value: number | '?',
    isActive: boolean,
    isRerolled: boolean,
    onClick: () => void
}>) {
    return (
        <Dice
            value={value}
            displayValue={value === '?' ? '?' : ''}
            baseClass={'d6-dice'}
            getClassFromValue={getFaceClass}
            isActive={isActive}
            isRerolled={isRerolled}
            onClick={onClick}/>
    )
}

export default D6Popup
