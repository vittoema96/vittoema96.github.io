import React, { useState, useRef, useEffect } from 'react'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { useI18n } from '../../hooks/useI18n.js'
import { useDataManager } from '../../hooks/useDataManager.js'
import { useTooltip } from '../../contexts/TooltipContext.jsx'
import { useDialog } from '../../hooks/useDialog.js'
import { getModifiedItemData } from '../../utils/itemUtils.js'
import { createInitialDiceState, createInitialExtraDiceState, rollRandomHitLocation } from '../../utils/diceUtils.js'

function D6Popup({ isOpen, onClose, characterItem = null, weaponId = null, hasAimed = false }) {
    const dialogRef = useRef(null)
    const t = useI18n()
    const { character, updateCharacter } = useCharacter()
    const dataManager = useDataManager()
    const { showTooltip, hideTooltip } = useTooltip()

    // Get weapon data with mods applied
    const weaponData = characterItem
        ? getModifiedItemData(dataManager, characterItem.id.split('_')[0], characterItem.mods)
        : (weaponId ? dataManager.getItem(weaponId) : null)

    // Helper function to check if weapon is melee
    const isMelee = (type) => {
        return type === 'meleeWeapons' || type === 'unarmed'
    }

    // Calculate damage rating (base + melee damage bonus)
    const getDamageRating = () => {
        if (!weaponData) return 2
        let rating = Number(weaponData.DAMAGE_RATING) || 2
        if (isMelee(weaponData.TYPE)) {
            rating += character?.meleeDamage || 0
        }
        return rating
    }

    // Calculate extra dice count
    const getExtraDiceCount = () => {
        if (!weaponData) return 0

        const isGatling = (weaponData.QUALITIES || []).includes('qualityGatling')
        const hasAccurate = (weaponData.QUALITIES || []).includes('qualityAccurate')

        if (isMelee(weaponData.TYPE)) {
            return 3 // Melee always has 3 extra dice
        } else if (weaponData.FIRE_RATE > 0) {
            return Number(weaponData.FIRE_RATE) * (isGatling ? 2 : 1)
        } else if (hasAimed && hasAccurate) {
            return 3 // Aimed + Accurate gives extra dice
        }
        return 0
    }

    const damageRating = getDamageRating()
    const extraDiceCount = getExtraDiceCount()

    // Hit locations
    const HIT_LOCATIONS = [
        { id: 'head', label: 'head', difficulty: 1 },
        { id: 'torso', label: 'torso', difficulty: 1 },
        { id: 'leftArm', label: 'leftArm', difficulty: 1 },
        { id: 'rightArm', label: 'rightArm', difficulty: 1 },
        { id: 'leftLeg', label: 'leftLeg', difficulty: 1 },
        { id: 'rightLeg', label: 'rightLeg', difficulty: 1 }
    ]

    // State
    const [hasRolled, setHasRolled] = useState(false)
    const initialDiceState = createInitialDiceState(damageRating)
    const [diceClasses, setDiceClasses] = useState(initialDiceState.classes)
    const [diceActive, setDiceActive] = useState(initialDiceState.active)
    const [diceRerolled, setDiceRerolled] = useState(initialDiceState.rerolled)

    const initialExtraDiceState = createInitialExtraDiceState(extraDiceCount)
    const [extraDiceClasses, setExtraDiceClasses] = useState(initialExtraDiceState.classes)
    const [extraDiceActive, setExtraDiceActive] = useState(initialExtraDiceState.active)
    const [extraDiceRerolled, setExtraDiceRerolled] = useState(initialExtraDiceState.rerolled)

    const [ammoCost, setAmmoCost] = useState(0)
    const [ammoPayed, setAmmoPayed] = useState(0)
    const [luckPayed, setLuckPayed] = useState(0)
    const [burstEffectsUsed, setBurstEffectsUsed] = useState(0) // Number of burst effects activated
    const [hitLocation, setHitLocation] = useState(rollRandomHitLocation()) // Selected hit location

    const currentLuck = character?.currentLuck || character?.special?.luck || 5
    const isGatling = (weaponData?.QUALITIES || []).includes('qualityGatling')
    const ammoStep = isGatling ? 10 : 1

    // Check if weapon has burst effect
    const hasBurst = (weaponData?.EFFECTS || []).some(effect => effect.startsWith('effectBurst'))

    // Helper function to reset all state
    const resetState = () => {
        setHasRolled(false)
        const diceState = createInitialDiceState(damageRating)
        setDiceClasses(diceState.classes)
        setDiceActive(diceState.active)
        setDiceRerolled(diceState.rerolled)

        const extraDiceState = createInitialExtraDiceState(extraDiceCount)
        setExtraDiceClasses(extraDiceState.classes)
        setExtraDiceActive(extraDiceState.active)
        setExtraDiceRerolled(extraDiceState.rerolled)

        setAmmoCost(ammoStep)
        setAmmoPayed(0)
        setLuckPayed(0)
        setBurstEffectsUsed(0)
        setHitLocation(rollRandomHitLocation())
    }

    // Get current ammo count
    const getCurrentAmmo = () => {
        if (!weaponData) return 0
        let ammoId = weaponData.AMMO_TYPE
        if (ammoId === 'self') ammoId = weaponData.ID
        if (ammoId === 'na') return 0

        const ammoItem = character.items?.find(item => item.id === ammoId)
        return ammoItem ? ammoItem.quantity : 0
    }

    // Get variable font size for weapon name
    const getVariableFontSize = (text, maxFontSize = 2, step = 0.25, lineSize = 13) => {
        const rows = Math.ceil(text.length / lineSize)
        if (rows > 1) {
            return `${maxFontSize - rows * step}rem`
        }
        return `${maxFontSize}rem`
    }

    // Get extra hits type (ap or ammo)
    const getExtraHitsType = () => {
        if (!weaponData) return null
        if (isMelee(weaponData.TYPE)) return 'ap'
        if (weaponData.FIRE_RATE > 0) return 'ammo'
        return null
    }

    // Count functions
    const getActiveDiceCount = () => diceActive.filter(Boolean).length
    const getActiveExtraDiceCount = () => extraDiceActive.filter(Boolean).length
    const getActiveCount = () => getActiveDiceCount() + getActiveExtraDiceCount()

    const getRerolledDiceCount = () => diceRerolled.filter(Boolean).length
    const getRerolledExtraDiceCount = () => extraDiceRerolled.filter(Boolean).length
    const getRerolledCount = () => getRerolledDiceCount() + getRerolledExtraDiceCount()

    // Luck Cost calculation (1 luck per 3 rerolled dice)
    const getLuckCost = () => {
        if (!hasRolled) return 0

        const rerolledCount = getRerolledCount()
        const payedLeftover = rerolledCount % 3
        const freeRerolls = payedLeftover > 0 ? 3 - payedLeftover : 0
        const luckCost = Math.ceil((getActiveCount() - freeRerolls) / 3)

        return Math.max(0, luckCost)
    }

    // Get dice face class from roll
    const getDiceClassFromRoll = (roll) => {
        if (roll >= 5) return 'd6-face-blank'
        if (roll >= 3) return 'd6-face-effect'
        if (roll >= 2) return 'd6-face-damage2'
        return 'd6-face-damage1'
    }

    // Count damage and effects
    const getEffectCount = () => {
        return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-effect').length
    }

    const getDamage1Count = () => {
        return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-damage1').length
    }

    const getDamage2Count = () => {
        return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-damage2').length
    }

    const getTotalDamage = () => {
        if (!hasRolled) return '?'
        const effects = getEffectCount()
        const damage1 = getDamage1Count()
        const damage2 = getDamage2Count()
        return effects + damage1 + damage2 * 2
    }

    const getTotalEffects = () => {
        if (!hasRolled) return '?'
        return getEffectCount()
    }

    // Handle damage dice click
    const handleDiceClick = (index) => {
        // Only toggle if rolled and not already rerolled
        if (hasRolled && !diceRerolled[index]) {
            setDiceActive(prev => {
                const newActive = [...prev]
                newActive[index] = !newActive[index]
                return newActive
            })
        }
    }

    // Handle extra dice click
    const handleExtraDiceClick = (index) => {
        if (!hasRolled) {
            // Before rolling: activate/deactivate extra dice (costs ammo)
            const isActivating = !extraDiceActive[index]

            // Check ammo availability
            let ammoId = weaponData?.AMMO_TYPE
            if (ammoId === 'self') ammoId = weaponData.ID
            if (ammoId === 'na') ammoId = null

            if (isActivating && ammoId) {
                const currentAmmo = character.items?.find(item => item.id === ammoId)?.quantity || 0
                if (currentAmmo < ammoCost + ammoStep) {
                    alert(t('notEnoughAmmoAlert') || 'Not enough ammo!')
                    return
                }
            }

            setExtraDiceActive(prev => {
                const newActive = [...prev]
                newActive[index] = !newActive[index]

                // Gatling: toggle pairs
                if (isGatling) {
                    const indexOffset = index % 2 === 0 ? 1 : -1
                    newActive[index + indexOffset] = !newActive[index + indexOffset]
                }

                return newActive
            })

            // Update ammo cost
            if (ammoId) {
                setAmmoCost(prev => prev + (isActivating ? 1 : -1) * ammoStep)
            }
        } else {
            // After rolling: toggle for reroll (only if rolled and not rerolled)
            if (extraDiceClasses[index] && !extraDiceRerolled[index]) {
                setExtraDiceActive(prev => {
                    const newActive = [...prev]
                    newActive[index] = !newActive[index]
                    return newActive
                })
            }
        }
    }

    // Handle roll/reroll
    const handleRoll = () => {
        if (getActiveCount() === 0) {
            alert(t('selectDiceAlert') || 'Select at least one die!')
            return
        }

        const luckCost = getLuckCost()
        if (currentLuck < luckCost) {
            alert(t('notEnoughLuckAlert') || 'Not enough luck!')
            return
        }

        // Roll damage dice
        const newClasses = [...diceClasses]
        const newRerolled = [...diceRerolled]

        diceActive.forEach((isActive, index) => {
            if (isActive) {
                const roll = Math.floor(Math.random() * 6) + 1
                newClasses[index] = getDiceClassFromRoll(roll)
                if (hasRolled) {
                    newRerolled[index] = true
                }
            }
        })

        setDiceClasses(newClasses)
        setDiceRerolled(newRerolled)
        setDiceActive(Array(damageRating).fill(false))

        // Roll extra dice
        const newExtraClasses = [...extraDiceClasses]
        const newExtraRerolled = [...extraDiceRerolled]

        extraDiceActive.forEach((isActive, index) => {
            if (isActive) {
                const roll = Math.floor(Math.random() * 6) + 1
                newExtraClasses[index] = getDiceClassFromRoll(roll)
                if (hasRolled) {
                    newExtraRerolled[index] = true
                }
            }
        })

        setExtraDiceClasses(newExtraClasses)
        setExtraDiceRerolled(newExtraRerolled)
        setExtraDiceActive(Array(extraDiceCount).fill(false))

        // First roll: consume ammo
        if (!hasRolled) {
            let ammoId = weaponData?.AMMO_TYPE
            if (ammoId === 'self') ammoId = weaponData.ID
            if (ammoId && ammoId !== 'na') {
                // Only consume base ammo cost on first roll
                updateCharacter({
                    items: character.items.map(item =>
                        item.id === ammoId
                            ? { ...item, quantity: item.quantity - ammoCost }
                            : item
                    ).filter(item => item.quantity > 0)
                })
                setAmmoPayed(ammoCost)
                setAmmoCost(0) // Reset cost after consuming
            }
        }

        // Update luck
        setLuckPayed(prev => prev + luckCost)
        if (luckCost > 0) {
            updateCharacter({ currentLuck: currentLuck - luckCost })
        }

        setHasRolled(true)
    }

    // Handle close with animation
    const handleClose = () => {
        const dialog = dialogRef.current
        if (dialog && dialog.open) {
            // Add closing animation class
            dialog.classList.add('dialog-closing')
            dialog.addEventListener(
                'animationend',
                () => {
                    dialog.classList.remove('dialog-closing')

                    // Consume burst ammo if any were selected
                    if (burstEffectsUsed > 0 && weaponData && !isMelee(weaponData.TYPE)) {
                        let ammoId = weaponData.AMMO_TYPE
                        if (ammoId === 'self') ammoId = weaponData.ID
                        if (ammoId && ammoId !== 'na') {
                            updateCharacter({
                                items: character.items.map(item =>
                                    item.id === ammoId
                                        ? { ...item, quantity: item.quantity - burstEffectsUsed }
                                        : item
                                ).filter(item => item.quantity > 0)
                            })
                        }
                    }

                    // Reset state
                    resetState()

                    if (dialog.open) {
                        dialog.close()
                    }
                    onClose()
                },
                { once: true }
            )
        } else {
            onClose()
        }
    }

    // Use dialog hook for dialog management
    const { handleBackdropClick } = useDialog(dialogRef, isOpen, handleClose)

    // Initialize state when popup opens
    useEffect(() => {
        if (isOpen && weaponData) {
            resetState()
            // Set initial ammo cost for melee weapons
            if (isMelee(weaponData.TYPE)) {
                setAmmoCost(t('na'))
            }
        }
    }, [isOpen, weaponId])

    if (!weaponData) return null

    const weaponName = t(weaponData.ID)
    const extraHitsType = getExtraHitsType()

    return (
        <dialog
            ref={dialogRef}
            onClick={handleBackdropClick}
            style={{
                zIndex: 10000,
                position: 'fixed'
            }}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <header className="l-lastSmall">
                    <span
                        className="h1 h1--margin-top"
                        style={{ fontSize: getVariableFontSize(weaponName) }}
                    >
                        {weaponName}
                    </span>
                    <button className="popup__button-x" onClick={handleClose}>&times;</button>
                </header>

                <span className="h3">{t(weaponData.DAMAGE_TYPE)}</span>

                {/* Effects and Qualities Tags */}
                <div className="row" style={{ flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                    {(weaponData.EFFECTS || []).map((effect, index) => {
                        const [langId, effectOpt] = effect.split(':')
                        const tooltipId = `${langId}Description`
                        return (
                            <span
                                key={`effect-${index}`}
                                className="tag"
                                data-tooltip-id={tooltipId}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    showTooltip(tooltipId, e.currentTarget)
                                }}
                            >
                                {t(langId) + (effectOpt ? ' ' + effectOpt : '')}
                            </span>
                        )
                    })}
                    {(weaponData.QUALITIES || []).map((quality, index) => {
                        const [langId, qualityOpt] = quality.split(':')
                        const tooltipId = `${langId}Description`
                        return (
                            <span
                                key={`quality-${index}`}
                                className="tag tag-empty"
                                data-tooltip-id={tooltipId}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    showTooltip(tooltipId, e.currentTarget)
                                }}
                            >
                                {t(langId) + (qualityOpt ? ' ' + qualityOpt : '')}
                            </span>
                        )
                    })}
                </div>

                <hr />

                {/* Hit Location Selector */}
                <div className="row l-distributed l-lastSmall">
                    <span>{t('hitLocation')}</span>
                    <select
                        value={hitLocation}
                        onChange={(e) => setHitLocation(e.target.value)}
                        style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--secondary-color)',
                            color: 'var(--primary-color)',
                            border: 'var(--border-primary-thin)',
                            fontSize: 'inherit',
                            borderRadius: '0.25rem',
                            width: 'auto',
                            minWidth: '150px',
                            flex: '0 0 auto'
                        }}
                    >
                        {HIT_LOCATIONS.map(location => (
                            <option key={location.id} value={location.id}>
                                {t(location.label)}
                            </option>
                        ))}
                    </select>
                </div>

                <hr />

                {/* Damage Dice */}
                <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.5rem' }}>
                    {diceClasses.map((diceClass, index) => (
                        <div
                            key={index}
                            className={`d6-dice dice ${diceClass || ''} ${diceActive[index] ? 'active' : ''} ${diceRerolled[index] ? 'rerolled' : ''}`}
                            onClick={() => handleDiceClick(index)}
                            style={{ cursor: hasRolled && !diceRerolled[index] ? 'pointer' : 'default' }}
                        >
                            {diceClass ? '' : '?'}
                        </div>
                    ))}
                </div>

                {/* Extra Hits */}
                {extraDiceCount > 0 && (
                    <>
                        <div className="row l-distributed l-lastSmall" style={{ marginTop: '0.5rem' }}>
                            <span>{t('extraHits')}</span>
                            <span>[{t(extraHitsType)}]</span>
                        </div>
                        <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                            {extraDiceClasses.map((diceClass, index) => (
                                <div
                                    key={index}
                                    className={`d6-dice dice ${diceClass || ''} ${extraDiceActive[index] ? 'active' : ''} ${extraDiceRerolled[index] ? 'rerolled' : ''}`}
                                    onClick={() => handleExtraDiceClick(index)}
                                    style={{ cursor: (!hasRolled || (diceClass && !extraDiceRerolled[index])) ? 'pointer' : 'default' }}
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
                {!isMelee(weaponData.TYPE) && (
                    <div className="row l-distributed l-lastSmall">
                        <span>{t('ammo')}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                            {!hasRolled ? (
                                // Before roll: show ammo about to consume / total
                                <span>{ammoCost} / {getCurrentAmmo()}</span>
                            ) : hasBurst ? (
                                // After roll with burst: show dropdown / total
                                // Max = min(effect dice rolled, current ammo)
                                <>
                                    <select
                                        value={burstEffectsUsed}
                                        onChange={(e) => setBurstEffectsUsed(parseInt(e.target.value))}
                                        style={{
                                            padding: '0.125rem 0.25rem',
                                            backgroundColor: 'var(--secondary-color)',
                                            color: 'var(--primary-color)',
                                            border: 'var(--border-primary-thin)',
                                            fontSize: 'inherit'
                                        }}
                                    >
                                        {Array.from({ length: Math.min(getEffectCount(), getCurrentAmmo()) + 1 }, (_, i) => (
                                            <option key={i} value={i}>{i}</option>
                                        ))}
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
                    <span>{getLuckCost()} / {currentLuck}</span>
                </div>

                <hr />

                <footer>
                    <button
                        className="popup__button-confirm"
                        onClick={handleRoll}
                        disabled={!isMelee(weaponData.TYPE) && getCurrentAmmo() < ammoCost}
                    >
                        {hasRolled ? t('reroll') : t('roll')}
                    </button>
                    <button className="popup__button-close" onClick={handleClose}>{t('close')}</button>
                </footer>
            </div>
        </dialog>
    )
}

export default D6Popup
