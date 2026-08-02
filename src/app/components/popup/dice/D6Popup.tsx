import { useEffect, useMemo, useRef, useState } from 'react';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useTranslation } from 'react-i18next';
import {
    CreatureType,
    getHitLocationFromRoll,
    rollD20,
} from '@/app/components/popup/utils/diceUtils.ts';
import { CharacterItem, GenericPopupProps } from '@/types';
import Tag from '@/app/components/Tag.tsx';
import { RollerType, usePopup } from '@/app/contexts/PopupContext.tsx';
import BasePopup from '@/app/components/popup/common/BasePopup.tsx';
import DialogPortal from '@/app/components/popup/common/DialogPortal.tsx';
import PopupHeader from '@/app/components/popup/common/PopupHeader.tsx';
import useDice from '@/hooks/useDice.ts';
import { D6Dice, getFaceClass } from '@/app/components/popup/dice/components/dice.tsx';

import { isCloseCombat } from '@/features/item/utils.ts';
import { useWeaponStats } from '@/features/character/hooks/useWeaponStats.ts';
import { FeatRollAction, getRollActions, getWeaponEffects } from '@/features/character/feats';

export interface D6PopupProps extends GenericPopupProps {
    usingItem: CharacterItem;
    hasAimed?: boolean;
    roller?: RollerType;
    hitTorso?: boolean;
}

function D6Popup({
    onClose,
    usingItem,
    hasAimed = false,
    roller = undefined,
    hitTorso = false,
}: Readonly<D6PopupProps>) {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { character, updateCharacter } = useCharacter();
    const { showConfirm } = usePopup();


    // Get weapon data with mods applied
    // TODO result is forced to not be null, decide how to handle it better
    const weaponStats = useWeaponStats(usingItem)!;

    const {
        itemData,
        damageBonus,
        fireRateBonus,
        ammoCount,
        ammoPerShot,
        legendaryMods
    } = weaponStats

    const fireRateNum = Number(itemData.FIRE_RATE) || 0;
    const ammoStep = roller ? 0 : ammoPerShot

    // Checks on EFFECTS and QUALITIES
    const weaponEffects = getWeaponEffects(character, itemData, hasAimed)
    const hasBurst = weaponEffects.some(e => e.effect === 'effectBurst');
    const isGatling = itemData.QUALITIES.includes('qualityGatling');
    const isAccurate = itemData.QUALITIES.includes('qualityAccurate');

    // User-selectable extra hits type for Accurate + Aimed
    const canChooseExtraHitsType =
        !isCloseCombat(itemData.CATEGORY) && //
        hasAimed &&
        isAccurate && // aiming + accurate allows to roll more damage (PA)
        fireRateNum > 0;

    // Extra dice: AP or AMMO cost?
    const defaultExtraHitType = isCloseCombat(itemData.CATEGORY)
        ? 'ap'
        : fireRateNum > 0
            ? 'ammo'
            : hasAimed && isAccurate
                ? 'ap'
                : null;

    const [extraHitTypeChoice, setExtraHitTypeChoice] = useState<'ap' | 'ammo' | null>(null);
    const extraHitsType = canChooseExtraHitsType
        ? (extraHitTypeChoice ?? defaultExtraHitType)
        : defaultExtraHitType;

    // Number of Damage dice
    const diceCount = itemData.DAMAGE_RATING + damageBonus;

    // Number of Extra dice
    const extraDiceCount = useMemo(() => {
        if (roller) {
            return 0;
        }
        if (isCloseCombat(itemData.CATEGORY)) {
            return 3; // Melee always has 3 extra dice (AP)
        }
        if (extraHitsType === 'ammo') {
            return Math.max(0, (fireRateNum + fireRateBonus) * (isGatling ? 2 : 1));
        }
        if (extraHitsType === 'ap') {
            return 3;
        }
        return 0;
    }, [roller, itemData.CATEGORY, extraHitsType, fireRateNum, fireRateBonus, isGatling]);

    // State
    const [hasRolled, setHasRolled] = useState(false);
    const [diceValues, setDiceValues, diceActive, setDiceActive, diceRerolled, setDiceRerolled] =
        useDice(diceCount, diceCount, roller ? diceCount : 0);
    const [
        extraDiceValues,
        setExtraDiceValues,
        extraDiceActive,
        setExtraDiceActive,
        extraDiceRerolled,
        setExtraDiceRerolled,
    ] = useDice(
        extraDiceCount,
        0,
        roller ? extraDiceCount : 0, // just in case, not actually needed
    );


    // Reinitialize extra dice arrays when count changes
    useEffect(() => {
        // If switching mode before rolling, reset ammo cost appropriately
        if (!hasRolled && !isCloseCombat(itemData.CATEGORY)) {
            setAmmoCost(ammoStep)
            setExtraDiceActive(new Array(extraDiceCount).fill(false))
        }
    }, [ammoStep, extraDiceCount, extraHitsType, hasRolled, itemData.CATEGORY, setExtraDiceActive]);

    const [ammoCost, setAmmoCost] = useState(ammoStep);
    const [targetCreatureType, setTargetCreatureType] = useState<CreatureType>('humanoid');
    const [hitLocationRoll, setHitLocationRoll] = useState(() => hitTorso ? 3 : rollD20()); // d20 roll for hit location (1-20); 3 = torso for both humanoid and mrHandy
    const hitLocation = getHitLocationFromRoll(hitLocationRoll, targetCreatureType);

    // States relative to PERKS
    const [burstEffectsUsed, setBurstEffectsUsed] = useState(0); // Number of burst effects activated




    const [meltdownDiceValues, setMeltdownDiceValues] = useState<number[]>([]); // Meltdown dice results

    // Meltdown functions
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
        setActiveModalId(null);
        setMeltdownDiceValues([]);
    };
    const confirmMeltdown = () => {
        setActionUsages(prev => ({ ...prev, perkMeltdown: 1}));
        closeMeltdownPopup();
    }

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
        let result = baseDamage;
        let extra = '';
        const hasVicious = weaponEffects.some(e => e.effect === 'effectVicious');
        const hasRadioactive = weaponEffects.some(e => e.effect === 'effectRadioactive');
        if (hasVicious) {
            result += effects;
            extra += ` (${baseDamage}+${effects})`;
        }
        if (hasRadioactive) {
            extra += ` +${effects}rads`; // TODO ugly UI, improve (ie with FatMan)
        }
        return `${result}${extra}`;
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


            // TODO this part can be improved
            // Check ammo availability
            let ammoId: string | undefined = itemData.AMMO_TYPE;
            if (ammoId === 'self') {
                ammoId = itemData.ID;
            }
            if (ammoId === 'na') {
                ammoId = undefined;
            }

            if (extraHitsType === 'ammo' && isActivating && ammoId) {
                if (ammoCount < ammoCost + ammoStep) {
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
            let ammoId = itemData.AMMO_TYPE;
            if (ammoId === 'self') {
                ammoId = itemData.ID;
            }
            if (ammoId && ammoId !== 'na') {
                // Only consume base ammo cost on first roll
                // TODO this removes from ALL the objects with that id, renamed items at risk
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
        if (burstEffectsUsed > 0 && itemData && !isCloseCombat(itemData.CATEGORY)) {
            let ammoId = itemData.AMMO_TYPE;
            if (ammoId === 'self') {
                ammoId = itemData.ID;
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


    const [actionUsages, setActionUsages] = useState<Record<string, number>>({})
    const [activeModalId, setActiveModalId] = useState<string | null>(null);

    useEffect(() => {
        if (activeModalId && dialogRef.current) {
            dialogRef.current.showModal();
        } else if (!activeModalId && dialogRef.current) {
            dialogRef.current.close();
        }
    }, [activeModalId]);

    // Get applicable actions for this character & weapon
    const rollActions = useMemo(() => {
        if (roller) {return []} // Popups used by "roller" mode never show perk buttons
        return getRollActions(character).filter(action =>
            action.isApplicable(character, itemData)
        );
    }, [character, itemData, roller]);

    // 2. Action execution handler
    const handleActionClick = (action: FeatRollAction) => {
        // If action opens a modal (like Meltdown)
        if (action.modalId) {
            setActiveModalId(action.modalId);
            return;
        }

        // Otherwise show standard confirm dialog
        const maxUses = action.getMaxUses?.(character) ?? 1;
        const currentUsed = actionUsages[action.id] ?? 0;
        const rankSuffix = maxUses > 1 ? ` (${currentUsed + 1}/${maxUses})` : '';

        showConfirm(
            `${t(action.id)}${rankSuffix}\n\n${action.getContent(t, getTotalDamage())}`,
            () => {
                // Deduct Luck if required
                if (action.cost?.luck) {
                    updateCharacter({ currentLuck: character.currentLuck - action.cost.luck });
                }
                // Deduct Ammo if required
                if (action.cost?.ammo) {
                    const amount = action.cost.ammo
                    const ammoId = itemData.AMMO_TYPE === 'self' ? itemData.ID : itemData.AMMO_TYPE;
                    if (ammoId && ammoId !== 'na') {
                        updateCharacter({
                            items: character.items
                                .map(item => item.id === ammoId ? { ...item, quantity: item.quantity - amount } : item)
                                .filter(item => item.quantity > 0),
                        });
                    }
                }
                // Increment usage count
                setActionUsages(prev => ({ ...prev, [action.id]: (prev[action.id] ?? 0) + 1 }));
            }
        );
    };

    return (
        <>
            <BasePopup
                title={itemData.ID}
                onClose={handleClose}
                footerChildren={
                    <>
                        {(!hasRolled ||
                            !(diceRerolled.every(Boolean) && extraDiceRerolled.every(Boolean))) && (
                            <button
                                className="confirmButton"
                                onClick={handleRoll}
                                disabled={
                                    !isCloseCombat(itemData.CATEGORY) &&
                                    ammoCount < ammoCost
                                }
                            >
                                {hasRolled ? t('reroll') : t('roll')}
                            </button>
                        )}

                        {rollActions.map((action) => {
                            const maxUses = action.getMaxUses?.(character) ?? 1;
                            const usedCount = actionUsages[action.id] ?? 0;

                            const isMaxedOut = usedCount >= maxUses;
                            const lacksLuck = (action.cost?.luck ?? 0) > character.currentLuck;
                            const lacksAmmo = (action.cost?.ammo ?? 0) > ammoCount;
                            const isDisabled = !hasRolled || isMaxedOut || lacksLuck || lacksAmmo;

                            const rankSuffix = maxUses > 1 ? ` (${usedCount + 1}/${maxUses})` : '';

                            return (
                                <button
                                    key={action.id}
                                    className="confirmButton"
                                    onClick={() => handleActionClick(action)}
                                    disabled={isDisabled}
                                    title={t(`${action.id}Description`)}
                                >
                                    {t(action.id)}{rankSuffix}
                                </button>
                            );
                        })}
                    </>
                }
            >
                <div className="stack no-gap">
                    {/* Damage Type */}
                    <div className="h4">
                        {t('damage')}: {itemData.DAMAGE_TYPES.map(dt => t(dt)).join(', ')}
                    </div>

                    {/* Effects and Qualities Tags */}
                    {(weaponEffects.length > 0 || itemData.QUALITIES.length > 0 || legendaryMods.length > 0) && (
                        <div
                            className="row l-centered"
                            style={{ flexWrap: 'wrap', gap: '0.25rem' }}
                        >
                            {weaponEffects.map(e => {
                                const values = [];
                                let other = {}
                                if (e.level) { values.push(e.level) }
                                if(e.bonus){
                                    values.push(e.bonus)
                                    other = {
                                        color: "var(--warning-color)"
                                    }
                                }
                                const label = [t(e.effect), values.join('+')].filter(Boolean).join(' ')
                                return (
                                    <Tag
                                        key={e.effect}
                                        tooltipId={`${e.effect}Description`}
                                        {...other}
                                    >
                                        {label}
                                    </Tag>
                                )
                            })}

                            {itemData.QUALITIES.map(effect => {
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

                            {legendaryMods.map(effect => {
                                return (
                                    <Tag key={effect}
                                         tooltipId={`${effect}Description`}
                                         color={'var(--warning-color)'}
                                    >
                                        {t(effect)}
                                    </Tag>
                                );
                            })}
                        </div>
                    )}
                </div>

                <hr style={{ margin: '0.25rem 0' }} />

                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{t('hitLocation')}:</span>
                {/* Hit Location - compact single row */}
                <div
                    className="row"
                    style={{ gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}
                >
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
                            overflowWrap: 'break-word',
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
                            marginBottom: extraDiceCount > 0 ? '0.5rem' : '0',
                        }}
                    >
                        {diceValues.map((value, index) => (
                            <D6Dice
                                value={value}
                                key={index}
                                isActive={diceActive[index]!}
                                isRerolled={diceRerolled[index]!}
                                onClick={() => handleDiceClick(index)}
                            />
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
                                    marginBottom: '0.25rem',
                                }}
                            >
                                <span>{t('extraHits')}</span>
                                {canChooseExtraHitsType ? (
                                    <select
                                        value={extraHitsType || 'ap'}
                                        onChange={e =>
                                            setExtraHitTypeChoice(e.target.value as 'ap' | 'ammo')
                                        }
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
                                    minHeight: '2.5rem',
                                }}
                            >
                                {extraDiceValues.map((value, index) => (
                                    <D6Dice
                                        key={index}
                                        value={value}
                                        isActive={extraDiceActive[index]!}
                                        isRerolled={extraDiceRerolled[index]!}
                                        onClick={() => handleExtraDiceClick(index)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <hr style={{ margin: '0.25rem 0' }} />

                {/* Stats - compact grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem' }}>{t('totalDamage')}</div>
                        <div className="h2" style={{ margin: 0 }}>
                            {getTotalDamage()}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem' }}>{t('totalEffects')}</div>
                        <div className="h2" style={{ margin: 0 }}>
                            {getTotalEffects()}
                        </div>
                    </div>
                </div>

                <hr style={{ margin: '0.25rem 0' }} />

                {!roller && (
                    <>
                        {/* Costs - compact */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: isCloseCombat(itemData.CATEGORY)
                                    ? '1fr'
                                    : '1fr 1fr',
                                gap: '0.5rem',
                                fontSize: '0.9rem',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {!isCloseCombat(itemData.CATEGORY) && (
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
                                            <span>
                                                {ammoCost} / {ammoCount}
                                            </span>
                                        ) : hasBurst ? (
                                            <>
                                                <select
                                                    value={burstEffectsUsed}
                                                    onChange={e =>
                                                        setBurstEffectsUsed(
                                                            parseInt(e.target.value),
                                                        )
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
                                                                    ammoCount,
                                                                ) + 1,
                                                        },
                                                        (_, i) => (
                                                            <option key={i} value={i}>
                                                                {i}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <span>/ {ammoCount}</span>
                                            </>
                                        ) : (
                                            <span>0 / {ammoCount}</span>
                                        )}
                                    </span>
                                </div>
                            )}

                            <div className="row" style={{ justifyContent: 'space-between' }}>
                                <span>{t('luck')}:</span>
                                <span>
                                    {getLuckCost()} / {character.currentLuck}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </BasePopup>

            {/* Meltdown Popup - inline dialog for rolling explosion dice */}
            {/* TODO standardize modal actions like Meltdown (include definition in perk*.ts file) */}
            <DialogPortal>
                <dialog
                    ref={dialogRef}
                    style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        minWidth: '300px',
                        maxWidth: '500px',
                    }}
                >
                    <PopupHeader title={t('meltdownTitle')} onClose={closeMeltdownPopup} />
                    <hr />

                    <div style={{ padding: '1rem 0' }}>
                        <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
                            {t('meltdownRollDice', { diceCount: getMeltdownDiceCount() })}
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                justifyContent: 'center',
                                marginBottom: '1rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            {Array.from({ length: getMeltdownDiceCount() }, (_, index) => {
                                const roll = meltdownDiceValues[index];
                                const diceClass = roll ? getFaceClass(roll) : null;

                                return (
                                    <div key={index} className={`d6-dice dice ${diceClass || ''}`}>
                                        {diceClass ? '' : '?'}
                                    </div>
                                );
                            })}
                        </div>

                        {meltdownDiceValues.length > 0 && (
                            <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                {t('meltdownResult', {
                                    effectCount: getMeltdownEffectCount(),
                                    totalDamage: getMeltdownEffectCount(),
                                })}
                            </p>
                        )}
                    </div>

                    <hr />
                    <footer style={{ padding: 0, marginTop: '0.25rem', gap: '0.5rem' }}>
                        <button
                            className="confirmButton"
                            onClick={
                                meltdownDiceValues.length === 0
                                    ? rollMeltdownDice
                                    : confirmMeltdown
                            }
                        >
                            {meltdownDiceValues.length === 0 ? t('roll') : t('confirm')}
                        </button>
                        <button className="closeButton" onClick={closeMeltdownPopup}>
                            {t('close')}
                        </button>
                    </footer>
                </dialog>
            </DialogPortal>
        </>
    );
}

export default D6Popup;
