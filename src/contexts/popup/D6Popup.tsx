import { useState, useRef, useEffect } from 'react';
import { useCharacter } from '@/contexts/CharacterContext'
import { useTranslation } from 'react-i18next'
import { useTooltip } from '@/contexts/TooltipContext'
import { useDialog } from '@/hooks/useDialog'
import { createInitialDiceState, rollD20, getHitLocationFromRoll, CreatureType } from '@/contexts/popup/utils/diceUtils.ts'
import { CharacterItem, GenericPopupProps, ItemCategory, WeaponItem } from '@/types';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import Tag from '@/components/Tag.tsx';
import PopupHeader from '@/contexts/popup/common/PopupHeader.tsx';
import DialogPortal from '@/contexts/popup/common/DialogPortal.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';


interface D6PopupProps extends GenericPopupProps {
    usingItem: CharacterItem;
    hasAimed: boolean;
    isMysteriousStranger: boolean;
}

function D6Popup({ onClose, usingItem, hasAimed = false, isMysteriousStranger = false }: Readonly<D6PopupProps>) {
    const { t } = useTranslation();
    const dataManager = getGameDatabase();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const meltdownDialogRef = useRef<HTMLDialogElement>(null);
    const { character, updateCharacter } = useCharacter();
    // Just use it, we do not need to manually trigger showTooltip
    // as we use it with standard .tag
    useTooltip();
    const { showConfirm } = usePopup();


    // Get weapon data with mods applied
    const weaponData = getModifiedItemData(usingItem) as WeaponItem;





    // Helper function to check if weapon is melee
    const isMelee = (itemCategory: ItemCategory) => {
        return itemCategory === 'meleeWeapons' || itemCategory === 'unarmed';
    };

    // Calculate damage rating (base + melee damage bonus)
    const getDamageRating = () => {
        if (!weaponData) {
            return 2;
        }
        let rating = weaponData.DAMAGE_RATING;
        if (isMelee(weaponData.CATEGORY)) {
            rating += character.meleeDamage;
        }
        if(weaponData.CATEGORY === "energyWeapons"){
            rating += character.perks.filter(p => p === 'perkLaserCommander').length
        }
        return rating;
    };

    const isGatling = (weaponData?.QUALITIES || []).includes('qualityGatling');
    const isAmmoHungry = (weaponData?.QUALITIES || []).some(q => q.startsWith('qualityAmmoHungry'));

    // Calculate extra dice count
    const getExtraDiceCount = () => {
        if (isMysteriousStranger || !weaponData) {
            return 0;
        }

        const hasAccurate = (weaponData.QUALITIES || []).includes('qualityAccurate');

        if (isMelee(weaponData.CATEGORY)) {
            return 3; // Melee always has 3 extra dice
        } else if (Number(weaponData.FIRE_RATE) > 0) {
            return Number(weaponData.FIRE_RATE) * (isGatling ? 2 : 1);
        } else if (hasAimed && hasAccurate) {
            // TODO user should be able to choose between:
            //  - 3 extra dice (aimed + accurate) costing AP
            //  - (regular) extra dice costing ammo
            return 3;
        }
        return 0;
    };

    const damageRating = getDamageRating();
    const extraDiceCount = getExtraDiceCount();

    // State
    const [hasRolled, setHasRolled] = useState(false);
    const initialDiceState = createInitialDiceState(damageRating);
    const [diceClasses, setDiceClasses] = useState(initialDiceState.classes);
    const [diceActive, setDiceActive] = useState(initialDiceState.active);
    const [diceRerolled, setDiceRerolled] = useState(isMysteriousStranger ? initialDiceState.active : initialDiceState.rerolled);

    const initialExtraDiceState = createInitialDiceState(extraDiceCount, false);
    const [extraDiceClasses, setExtraDiceClasses] = useState(initialExtraDiceState.classes);
    const [extraDiceActive, setExtraDiceActive] = useState(initialExtraDiceState.active);
    const [extraDiceRerolled, setExtraDiceRerolled] = useState(initialExtraDiceState.rerolled);

    let ammoStep = 0;
    if(!isMysteriousStranger && !["na", undefined, "-"].includes(weaponData.AMMO_TYPE)){
        if(isGatling){
            ammoStep = 10;
        } else if(isAmmoHungry) {
            const quality = weaponData.QUALITIES?.find(q => q.startsWith("qualityAmmoHungry"))
            const [_, qualityOpt] = quality?.split(':') ?? [];
            ammoStep = Number(qualityOpt) || 1;
        } else {
            ammoStep = 1
        }
    }
    const [ammoCost, setAmmoCost] = useState(ammoStep);
    const [ammoPayed, setAmmoPayed] = useState(0);
    const [luckPayed, setLuckPayed] = useState(0);
    const [burstEffectsUsed, setBurstEffectsUsed] = useState(0); // Number of burst effects activated
    const [creatureType, setCreatureType] = useState<CreatureType>('humanoid'); // Creature type for hit location
    const [hitLocationRoll, setHitLocationRoll] = useState(rollD20()); // d20 roll for hit location (1-20)
    const [gunFuUsed, setGunFuUsed] = useState(false); // Track if Gun Fu has been used
    const [slayerUsed, setSlayerUsed] = useState(false); // Track if Slayer has been used
    const [meltdownUsed, setMeltdownUsed] = useState(false); // Track if Meltdown has been used
    const [meltdownPopupOpen, setMeltdownPopupOpen] = useState(false); // Track if Meltdown popup is open
    const [meltdownDiceValues, setMeltdownDiceValues] = useState<number[]>([]); // Meltdown dice results

    // Calculate hit location from roll and creature type
    const hitLocation = getHitLocationFromRoll(hitLocationRoll, creatureType);

    // Handle Meltdown popup open/close
    useEffect(() => {
        if (meltdownPopupOpen && meltdownDialogRef.current) {
            meltdownDialogRef.current.showModal();
        } else if (!meltdownPopupOpen && meltdownDialogRef.current) {
            meltdownDialogRef.current.close();
        }
    }, [meltdownPopupOpen]);

    // Reroll hit location (rolls a new d20)
    const rerollHitLocation = () => {
        setHitLocationRoll(rollD20());
    };

    // Meltdown functions
    const getMeltdownDiceCount = () => {
        return Math.floor(getDamageRating() / 2);
    };

    const rollMeltdownDice = () => {
        const diceCount = getMeltdownDiceCount();
        const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setMeltdownDiceValues(rolls);
    };

    const getMeltdownEffectCount = () => {
        // Effects are on rolls 3-4
        return meltdownDiceValues.filter(roll => roll >= 3 && roll <= 4).length;
    };

    const closeMeltdownPopup = () => {
        setMeltdownPopupOpen(false);
        setMeltdownUsed(true);
        setMeltdownDiceValues([]);
    };

    if(!dataManager.isType(weaponData, "weapon")){
        return null;
    }

    // Check if weapon has burst effect
    const hasBurst = (weaponData?.EFFECTS || []).includes('effectBurst');

    // Get current ammo count
    // TODO check that self and na exist and no other values other than actual ammo exist
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

    // Get extra hits type (ap or ammo)
    const getExtraHitsType = () => {
        // TODO should probably check for aimed + accurate too
        if (!weaponData) {
            return null;
        }
        if (isMelee(weaponData.CATEGORY)) {
            return 'ap';
        }
        if (Number(weaponData.FIRE_RATE) > 0) {
            return 'ammo';
        }
        return null;
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

    // Get dice face class from roll
    const getDiceClassFromRoll = (roll: number) => {
        if (roll >= 5) {
            return 'd6-face-blank';
        }
        if (roll >= 3) {
            return 'd6-face-effect';
        }
        if (roll >= 2) {
            return 'd6-face-damage2';
        }
        return 'd6-face-damage1';
    };

    // Count damage and effects
    const getEffectCount = () => {
        return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-effect').length;
    };

    const getDamage1Count = () => {
        return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-damage1').length;
    };

    const getDamage2Count = () => {
        return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-damage2').length;
    };

    const getTotalDamage = () => {
        if (!hasRolled) {
            return '?';
        }
        const effects = getEffectCount();
        const damage1 = getDamage1Count();
        const damage2 = getDamage2Count();
        if(weaponData.EFFECTS?.includes('effectVicious')){
            const baseDamage = effects + damage1 + damage2 * 2;
            return `${baseDamage + effects} (${baseDamage}+${effects})`
        }
        return effects + damage1 + damage2 * 2;
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
            let ammoId = weaponData?.AMMO_TYPE;
            if (ammoId === 'self') {
                ammoId = weaponData?.ID;
            }
            if (ammoId === 'na') {
                ammoId = undefined;
            }

            if (isActivating && ammoId) {
                const currentAmmo = character.items.find(item => item.id === ammoId)?.quantity ?? 0;
                if (currentAmmo < ammoCost + ammoStep) {
                    alert(t('notEnoughAmmoAlert') || 'Not enough ammo!');
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

            // Update ammo cost
            if (ammoId) {
                setAmmoCost(prev => prev + (isActivating ? 1 : -1) * ammoStep);
            }
        } else {
            // After rolling: toggle for reroll (only if rolled and not rerolled)
            if (extraDiceClasses[index] && !extraDiceRerolled[index]) {
                setExtraDiceActive(prev => {
                    const newActive = [...prev];
                    newActive[index] = !newActive[index];
                    return newActive;
                });
            }
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
        const newClasses = [...diceClasses];
        const newRerolled = [...diceRerolled];

        diceActive.forEach((isActive, index) => {
            if (isActive) {
                const roll = Math.floor(Math.random() * 6) + 1;
                newClasses[index] = getDiceClassFromRoll(roll);
                if (hasRolled) {
                    newRerolled[index] = true;
                }
            }
        });

        setDiceClasses(newClasses);
        setDiceRerolled(newRerolled);
        setDiceActive(new Array(damageRating).fill(false));

        // Roll extra dice
        const newExtraClasses = [...extraDiceClasses];
        const newExtraRerolled = [...extraDiceRerolled];

        extraDiceActive.forEach((isActive, index) => {
            if (isActive) {
                const roll = Math.floor(Math.random() * 6) + 1;
                newExtraClasses[index] = getDiceClassFromRoll(roll);
                if (hasRolled) {
                    newExtraRerolled[index] = true;
                }
            }
        });

        setExtraDiceClasses(newExtraClasses);
        setExtraDiceRerolled(newExtraRerolled);
        setExtraDiceActive(new Array(extraDiceCount).fill(false));

        // First roll: consume ammo
        if (!hasRolled) {
            let ammoId = weaponData?.AMMO_TYPE;
            if (ammoId === 'self') {
                ammoId = weaponData?.ID;
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
                setAmmoPayed(ammoCost);
                setAmmoCost(0); // Reset cost after consuming
            }
        }

        // Update luck
        setLuckPayed(prev => prev + luckCost);
        if (luckCost > 0) {
            updateCharacter({ currentLuck: character.currentLuck - luckCost });
        }

        setHasRolled(true);
    };

    const callback = () => {
        // Consume burst ammo if any were selected
        if (burstEffectsUsed > 0 && weaponData && !isMelee(weaponData.CATEGORY)) {
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
    };

    // Use dialog hook for dialog management
    const { closeWithAnimation } = useDialog(dialogRef, onClose);

    if (!weaponData) {
        return null;
    }

    const extraHitsType = getExtraHitsType();

    return (
        <DialogPortal>
        <dialog ref={dialogRef} style={{ minWidth: '300px', maxWidth: '320px' }}>
            <PopupHeader title={weaponData.ID} onClose={() => closeWithAnimation(callback)}/>

            {/* Compact header: damage type + effects/qualities in one section */}
            <div style={{ marginBottom: '0.25rem' }}>
                <div className="h4" style={{ marginBottom: '0.25rem' }}>
                    {t('damage')}: {t(weaponData.DAMAGE_TYPE)}
                </div>

                {/* Effects and Qualities Tags - compact */}
                {(weaponData.EFFECTS?.length > 0 || weaponData.QUALITIES?.length > 0) && (
                    <div
                        className="row"
                        style={{ flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}
                    >
                        {weaponData.EFFECTS?.map(effect => {
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

                        {weaponData.QUALITIES?.map(effect => {
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
                    value={creatureType}
                    onChange={e => setCreatureType(e.target.value as CreatureType)}
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
                    onClick={rerollHitLocation}
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
                    {diceClasses.map((diceClass, index) => (
                        <div
                            key={index}
                            className={`d6-dice dice ${diceClass || ''} ${diceActive[index] ? 'active' : ''} ${diceRerolled[index] ? 'rerolled' : ''}`}
                            onClick={() => handleDiceClick(index)}
                            style={{
                                cursor: hasRolled && !diceRerolled[index] ? 'pointer' : 'default',
                            }}
                        >
                            {diceClass ? '' : '?'}
                        </div>
                    ))}
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
                            <span>[{t(extraHitsType)}]</span>
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
                            {extraDiceClasses.map((diceClass, index) => (
                                <div
                                    key={index}
                                    className={`d6-dice dice ${diceClass || ''} ${extraDiceActive[index] ? 'active' : ''} ${extraDiceRerolled[index] ? 'rerolled' : ''}`}
                                    onClick={() => handleExtraDiceClick(index)}
                                    style={{
                                        cursor:
                                            !hasRolled || (diceClass && !extraDiceRerolled[index])
                                                ? 'pointer'
                                                : 'default',
                                    }}
                                >
                                    {diceClass ? '' : '?'}
                                </div>
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

            {!isMysteriousStranger && (
                <>
                    {/* Costs - compact */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: !isMelee(weaponData.CATEGORY) ? '1fr 1fr' : '1fr',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        marginBottom: '0.25rem'
                    }}>
                        {!isMelee(weaponData.CATEGORY) && (
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

                    <hr style={{ margin: '0.25rem 0' }} />
                </>
            )}

            <footer>
                {(!hasRolled || !(diceRerolled.every(Boolean) && extraDiceRerolled.every(Boolean))) && (
                    <button
                        className="popup__button-confirm"
                        onClick={handleRoll}
                        disabled={!isMelee(weaponData.CATEGORY) && getCurrentAmmo() < ammoCost}
                    >
                        {hasRolled ? t('reroll') : t('roll')}
                    </button>
                )}

                {/* Gun Fu button - only for ranged weapons when player has the perk */}
                {!isMysteriousStranger &&
                 !isMelee(weaponData.CATEGORY) &&
                 character.perks.includes('perkGunFu') &&
                 !gunFuUsed && (
                    <button
                        className="popup__button-confirm"
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
                {!isMysteriousStranger &&
                 isMelee(weaponData.CATEGORY) &&
                 character.perks.includes('perkSlayer') &&
                 !slayerUsed && (
                    <button
                        className="popup__button-confirm"
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
                {!isMysteriousStranger &&
                 weaponData.CATEGORY === 'energyWeapons' &&
                 character.perks.includes('perkMeltdown') &&
                 !meltdownUsed && (
                    <button
                        className="popup__button-confirm"
                        onClick={() => {
                            setMeltdownPopupOpen(true);
                        }}
                        disabled={!hasRolled}
                        title={t('perkMeltdownDescription')}
                    >
                        {t('perkMeltdown')}
                    </button>
                )}

                <button
                    className="popup__button-close"
                    onClick={() => closeWithAnimation(callback)}
                >
                    {t('close')}
                </button>
            </footer>
        </dialog>

        {/* Meltdown Popup - inline dialog for rolling explosion dice */}
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
                            const diceClass = roll ? getDiceClassFromRoll(roll) : null;

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
                        className="popup__button-confirm"
                        onClick={meltdownDiceValues.length === 0 ? rollMeltdownDice : closeMeltdownPopup}
                    >
                        {meltdownDiceValues.length === 0 ? t('roll') : t('confirm')}
                    </button>
                    <button
                        className="popup__button-close"
                        onClick={closeMeltdownPopup}
                    >
                        {t('close')}
                    </button>
                </footer>
            </dialog>
        </DialogPortal>
    );
}

export default D6Popup
