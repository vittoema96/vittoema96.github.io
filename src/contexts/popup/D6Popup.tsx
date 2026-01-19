import { useState, useRef, useEffect } from 'react'
import { useCharacter } from '@/contexts/CharacterContext'
import { useTranslation } from 'react-i18next'
import { useTooltip } from '@/contexts/TooltipContext'
import { useDialog } from '@/hooks/useDialog'
import { createInitialDiceState, rollRandomHitLocation } from '@/contexts/popup/utils/diceUtils.ts'
import { BODY_PARTS, CharacterItem, GenericPopupProps, ItemCategory, WeaponItem } from '@/types';
import { getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { FitText } from '@/app/FitText.tsx';
import Tag from '@/components/Tag.tsx';


interface D6PopupProps extends GenericPopupProps {
    usingItem: CharacterItem | null;
    hasAimed: boolean;
}

function D6Popup({ onClose, usingItem = null, hasAimed = false }: Readonly<D6PopupProps>) {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { character, updateCharacter } = useCharacter();
    // Just use it, we do not need to manually trigger showTooltip
    // as we use it with standard .tag
    useTooltip();

    // Get weapon data with mods applied
    const weaponData = usingItem ? (getModifiedItemData(usingItem) as WeaponItem) : null;

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
        return rating;
    };

    const isGatling = (weaponData?.QUALITIES || []).includes('qualityGatling');

    // Calculate extra dice count
    const getExtraDiceCount = () => {
        if (!weaponData) {
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
    const [diceRerolled, setDiceRerolled] = useState(initialDiceState.rerolled);

    const initialExtraDiceState = createInitialDiceState(extraDiceCount, false);
    const [extraDiceClasses, setExtraDiceClasses] = useState(initialExtraDiceState.classes);
    const [extraDiceActive, setExtraDiceActive] = useState(initialExtraDiceState.active);
    const [extraDiceRerolled, setExtraDiceRerolled] = useState(initialExtraDiceState.rerolled);

    const [ammoCost, setAmmoCost] = useState(0);
    const [ammoPayed, setAmmoPayed] = useState(0);
    const [luckPayed, setLuckPayed] = useState(0);
    const [burstEffectsUsed, setBurstEffectsUsed] = useState(0); // Number of burst effects activated
    const [hitLocation, setHitLocation] = useState(rollRandomHitLocation()); // Selected hit location

    const ammoStep = isGatling ? 10 : 1;

    // Check if weapon has burst effect
    const hasBurst = (weaponData?.EFFECTS || []).includes('effectBurst');

    // Helper function to reset all state
    const resetState = () => {
        setHasRolled(false);
        const diceState = createInitialDiceState(damageRating);
        setDiceClasses(diceState.classes);
        setDiceActive(diceState.active);
        setDiceRerolled(diceState.rerolled);

        const extraDiceState = createInitialDiceState(extraDiceCount, false);
        setExtraDiceClasses(extraDiceState.classes);
        setExtraDiceActive(extraDiceState.active);
        setExtraDiceRerolled(extraDiceState.rerolled);

        setAmmoCost(ammoStep);
        setAmmoPayed(0);
        setLuckPayed(0);
        setBurstEffectsUsed(0);
        setHitLocation(rollRandomHitLocation());
    };

    // Get current ammo count
    // TODO check that self and na exist and no other values other than actual ammo exist
    const getCurrentAmmo = () => {
        if (!weaponData) {
            return 0;
        }
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
                    newActive[index + indexOffset] = !newActive[index + indexOffset];
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

    // Initialize state when popup opens
    useEffect(() => {
        if (weaponData) {
            resetState();
            // Set initial ammo cost for melee weapons
            if (isMelee(weaponData.CATEGORY)) {
                setAmmoCost(t('na'));
            }
        }
    }, []);

    if (!weaponData) {
        return null;
    }

    const extraHitsType = getExtraHitsType();

    return (
        <dialog
            ref={dialogRef}
            style={{
                zIndex: 10000,
                position: 'fixed',
            }}
        >
            <div>
                <div
                    style={{ gap: '1rem', display: 'flex' }}
                    className="l-lastSmall"
                >
                    <FitText minSize={20} maxSize={40}>{t(weaponData.ID)}</FitText>
                    <button
                        className="popup__button-x"
                        onClick={() => closeWithAnimation(callback)}
                    >
                        &times;
                    </button>
                </div>

                <div style={{ marginBottom: '0.5rem' }} className="h4">{t("damage")}: {t(weaponData.DAMAGE_TYPE)}</div>

                {/* Effects and Qualities Tags */}
                <div
                    className="row"
                    style={{ flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}
                >
                    {/* Intrinsic EFFECTS (from base item) */}
                    {weaponData.EFFECTS?.map(effect => {
                        const [effectType, effectOpt] = effect.split(':');
                        // If it's a number, keep it as is. If it's a string, try to translate it.
                        let displayValue = t(effectOpt!); // undefined or number = itself, translatable gets translated
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
                        // If it's a number, keep it as is. If it's a string, try to translate it.
                        let displayValue = t(qualityOpt!); // undefined or number = itself, translatable gets translated
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

                <hr />

                {/* Hit Location Selector */}
                <div className="row l-distributed l-lastSmall">
                    <span>{t('hitLocation')}</span>
                    <select
                        value={hitLocation}
                        onChange={e => setHitLocation(e.target.value)}
                        style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--secondary-color)',
                            color: 'var(--primary-color)',
                            border: 'var(--border-primary-thin)',
                            fontSize: 'inherit',
                            borderRadius: '0.25rem',
                            width: 'auto',
                            minWidth: '150px',
                            flex: '0 0 auto',
                        }}
                    >
                        {Array.from(BODY_PARTS, location => (
                            <option key={location} value={location}>
                                {t(location)}
                            </option>
                        ))}
                    </select>
                </div>

                <hr />

                {/* Damage Dice */}
                <div
                    className="row"
                    style={{ flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.5rem' }}
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
                            className="row l-distributed l-lastSmall"
                            style={{ marginTop: '0.5rem' }}
                        >
                            <span>{t('extraHits')}</span>
                            <span>[{t(extraHitsType)}]</span>
                        </div>
                        <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
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

                <hr />

                {/* Stats */}
                <div className="row l-distributed l-lastSmall">
                    <span>{t('totalDamage')}</span>
                    <span className="h2">{getTotalDamage()}</span>
                </div>

                <div className="row l-distributed l-lastSmall">
                    <span>{t('totalEffects')}</span>
                    <span className="h2">{getTotalEffects()}</span>
                </div>

                <hr />

                {/* Costs */}
                {!isMelee(weaponData.CATEGORY) && (
                    <div className="row l-distributed l-lastSmall">
                        <span>{t('ammo')}</span>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {!hasRolled ? (
                                // Before roll: show ammo about to consume / total
                                <span>
                                    {ammoCost} / {getCurrentAmmo()}
                                </span>
                            ) : hasBurst ? (
                                // After roll with burst: show dropdown / total
                                // Max = min(effect dice rolled, current ammo)
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
                                            fontSize: 'inherit',
                                        }}
                                    >
                                        {Array.from(
                                            {
                                                length:
                                                    Math.min(getEffectCount(), getCurrentAmmo()) +
                                                    1,
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
                                // After roll without burst: show 0 / total
                                <span>0 / {getCurrentAmmo()}</span>
                            )}
                        </span>
                    </div>
                )}

                <div className="row l-distributed l-lastSmall">
                    <span>{t('luck')}</span>
                    <span>
                        {getLuckCost()} / {character.currentLuck}
                    </span>
                </div>

                <hr />

                <footer>
                    <button
                        className="popup__button-confirm"
                        onClick={handleRoll}
                        disabled={!isMelee(weaponData.CATEGORY) && getCurrentAmmo() < ammoCost}
                    >
                        {hasRolled ? t('reroll') : t('roll')}
                    </button>
                    <button
                        className="popup__button-close"
                        onClick={() => closeWithAnimation(callback)}
                    >
                        {t('close')}
                    </button>
                </footer>
            </div>
        </dialog>
    );
}

export default D6Popup
