import React, { useState, useRef, useEffect } from 'react'
import { useCharacter, getEffectiveSkillValue } from '../../contexts/CharacterContext.jsx'
import { useI18n } from '../../hooks/useI18n.js'
import { useDataManager } from '../../hooks/useDataManager.js'
import { usePopup } from '../../contexts/PopupContext.jsx'
import { SKILL_TO_SPECIAL_MAP , SPECIAL } from '../../js/constants.js'

function D20Popup({ isOpen, onClose, skillId, weaponId = null }) {
    const dialogRef = useRef(null)
    const t = useI18n()
    const { character, updateCharacter } = useCharacter()
    const dataManager = useDataManager()
    const { showD6Popup } = usePopup()

    // Get weapon data if weaponId is provided
    const weaponData = weaponId ? dataManager.getItem(weaponId) : null

    // Check if weapon has enough ammo
    const hasEnoughAmmo = () => {
        if (!weaponData) return true
        const weaponType = weaponData.TYPE
        if (weaponType === 'meleeWeapons' || weaponType === 'unarmed') return true

        let ammoId = weaponData.AMMO_TYPE
        if (ammoId === 'self') ammoId = weaponData.ID
        if (ammoId === 'na') return true

        const ammoItem = character.items?.find(item => item.id === ammoId)
        const currentAmmo = ammoItem ? ammoItem.quantity : 0

        const isGatling = (weaponData.QUALITIES || []).includes('qualityGatling')
        const ammoStep = isGatling ? 10 : 1

        return currentAmmo >= ammoStep
    }

    // State
    const [isUsingLuck, setIsUsingLuck] = useState(false)
    const [selectedSpecial, setSelectedSpecial] = useState(SKILL_TO_SPECIAL_MAP[skillId] || 'strength')
    const [isAiming, setIsAiming] = useState(false)
    const [hasRolled, setHasRolled] = useState(false)
    const [diceValues, setDiceValues] = useState(['?', '?', '?', '?', '?'])
    const [diceActive, setDiceActive] = useState([true, true, false, false, false])
    const [diceRerolled, setDiceRerolled] = useState([false, false, false, false, false])
    const [initialApCost, setInitialApCost] = useState(0) // Store AP cost from first roll

    // Calculations
    const skillValue = getEffectiveSkillValue(character, skillId)
    const hasSpecialty = character?.specialties?.includes(skillId) || false
    const activeSpecialId = isUsingLuck ? 'luck' : selectedSpecial
    const specialValue = character?.special?.[activeSpecialId] || 5
    const targetNumber = skillValue + specialValue
    const criticalValue = hasSpecialty ? skillValue : 1
    const currentLuck = character?.currentLuck || character?.special?.luck || 5
    const maxLuck = character?.special?.luck || 5

    // Get variable font size for skill title
    const getVariableFontSize = (text, maxFontSize = 2, step = 0.25, lineSize = 13) => {
        const rows = Math.ceil(text.length / lineSize)
        if (rows > 1) {
            return `${maxFontSize - rows * step}rem`
        }
        return `${maxFontSize}rem`
    }

    const skillName = t(skillId)

    // AP Cost calculation
    const getApCost = () => {
        // After first roll, return the initial AP cost
        if (hasRolled) {
            return initialApCost
        }

        // Before first roll, calculate based on active dice
        const activeDiceCount = diceActive.filter(Boolean).length
        switch (activeDiceCount) {
            case 5: return 6
            case 4: return 3
            case 3: return 1
            default: return 0
        }
    }

    // Luck Cost calculation
    const getLuckCost = () => {
        if (!hasRolled) {
            return isUsingLuck ? 1 : 0
        } else {
            const rerollingCount = diceActive.filter(Boolean).length
            const rerolledCount = diceRerolled.filter(Boolean).length
            let luckCost = rerollingCount
            
            // First reroll is free with aiming
            if (isAiming && rerolledCount === 0) {
                luckCost -= 1
            }
            return Math.max(0, luckCost)
        }
    }

    // Success calculation
    const getSuccesses = () => {
        if (!hasRolled) return '?'

        let successes = 0

        diceValues.forEach((value) => {
            // Count successes only for rolled dice (not '?')
            if (typeof value === 'number' && value <= targetNumber) {
                successes++
            }
        })

        return successes
    }

    // Get dice class based on value
    const getDiceClass = (value) => {
        if (typeof value !== 'number') return ''

        if (value === 20) {
            return 'roll-complication' // Critical fail (20)
        } else if (value <= criticalValue) {
            return 'roll-crit' // Critical hit
        }

        return ''
    }

    // Handle dice click
    // Before roll: Clicking a die selects all previous dice, toggles the clicked die, and deselects all subsequent dice
    // After roll: Each rolled die can be toggled individually for reroll
    // Minimum 2 dice must be selected before first roll
    const handleDiceClick = (index) => {
        // After roll: only allow clicking on rolled dice (not '?')
        if (hasRolled && diceValues[index] === '?') {
            return // Can't select unrolled dice
        }

        setDiceActive(prev => {
            const newActive = [...prev]

            if (!hasRolled) {
                // Before roll: cascade selection logic
                const willBeActive = !prev[index]

                // Special case: clicking die 0 or die 1 should deselect all dice after index 1
                if (index <= 1) {
                    for (let i = 0; i < newActive.length; i++) {
                        if (i < index) {
                            newActive[i] = true // Select all previous
                        } else if (i === index) {
                            newActive[i] = willBeActive // Toggle clicked
                        } else {
                            newActive[i] = false // Deselect all after (including 2, 3, 4)
                        }
                    }
                } else {
                    // For dice 2, 3, 4: normal cascade logic
                    for (let i = 0; i < newActive.length; i++) {
                        if (i < index) {
                            newActive[i] = true // Select all previous
                        } else if (i === index) {
                            newActive[i] = willBeActive // Toggle clicked
                        } else {
                            newActive[i] = false // Deselect all after
                        }
                    }
                }

                // Ensure at least 2 dice are selected
                const activeCount = newActive.filter(Boolean).length
                if (activeCount < 2) {
                    return prev
                }
            } else {
                // After roll: simple toggle for rolled dice
                newActive[index] = !prev[index]
            }

            return newActive
        })
    }

    // Handle roll/reroll
    const handleRoll = () => {
        const activeDiceCount = diceActive.filter(Boolean).length
        if (activeDiceCount === 0) {
            alert(t('selectDiceAlert') || 'Select at least one die!')
            return
        }

        const luckCost = getLuckCost()
        if (currentLuck < luckCost) {
            alert(t('notEnoughLuckAlert') || 'Not enough luck!')
            return
        }

        // Save initial AP cost on first roll
        if (!hasRolled) {
            const apCost = getApCost()
            setInitialApCost(apCost)
        }

        // Roll dice
        const newValues = [...diceValues]
        const newRerolled = [...diceRerolled]

        diceActive.forEach((isActive, index) => {
            if (isActive) {
                newValues[index] = Math.floor(Math.random() * 20) + 1
                if (hasRolled) {
                    newRerolled[index] = true
                }
            }
        })

        setDiceValues(newValues)
        setDiceRerolled(newRerolled)
        setHasRolled(true)

        // Deselect all dice after roll/reroll
        setDiceActive([false, false, false, false, false])

        // Update luck AFTER setting hasRolled to true
        if (luckCost > 0) {
            updateCharacter({ currentLuck: currentLuck - luckCost })
        }
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

                    // Reset state
                    setIsUsingLuck(false)
                    setSelectedSpecial(SKILL_TO_SPECIAL_MAP[skillId] || 'strength')
                    setIsAiming(false)
                    setHasRolled(false)
                    setDiceValues(['?', '?', '?', '?', '?'])
                    setDiceActive([true, true, false, false, false])
                    setDiceRerolled([false, false, false, false, false])
                    setInitialApCost(0)

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

    // Dialog management
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen && !dialog.open) {
            dialog.showModal()
        } else if (!isOpen && dialog.open) {
            dialog.close()
        }
    }, [isOpen])

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        // Only close if clicking directly on the dialog backdrop (not on dialog content)
        if (e.target === dialogRef.current) {
            handleClose()
        }
    }

    if (!skillId) return null

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
                    className="h1"
                    style={{ fontSize: getVariableFontSize(skillName) }}
                >
                    {skillName}
                </span>
                <button className="popup__button-x" onClick={handleClose}>&times;</button>
            </header>

            <div className="l-lastSmall row">
                <select
                    value={isUsingLuck ? 'luck' : selectedSpecial}
                    onChange={(e) => {
                        const value = e.target.value
                        if (value === 'luck') {
                            setIsUsingLuck(true)
                        } else {
                            setIsUsingLuck(false)
                            setSelectedSpecial(value)
                        }
                    }}
                    disabled={hasRolled || isUsingLuck}
                    aria-label="Special to use?"
                >
                    {Object.values(SPECIAL).map(specialValue => (
                        <option key={specialValue} value={specialValue}>
                            {t(specialValue)}
                        </option>
                    ))}
                </select>
                <input
                    type="checkbox"
                    className="themed-svg"
                    data-icon="luck"
                    checked={isUsingLuck}
                    onChange={(e) => {
                        setIsUsingLuck(e.target.checked)
                    }}
                    disabled={hasRolled}
                    aria-label="Use Luck"
                />
            </div>

            <hr />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span className="h2">Target: {targetNumber}</span>
                <span className="h5">{skillValue} (Skill) + {specialValue} ({t(activeSpecialId) || activeSpecialId})</span>
                <span className="h5">Critical Hit: Roll {criticalValue > 1 ? `≤` : `=`} {criticalValue}</span>
            </div>

            <hr />

            <div className="row">
                {diceValues.map((value, index) => {
                    const diceClass = getDiceClass(value)
                    return (
                        <div
                            key={index}
                            className={`d20-dice dice ${diceActive[index] ? 'active' : ''} ${diceRerolled[index] ? 'rerolled' : ''} ${diceClass}`}
                            onClick={() => handleDiceClick(index)}
                            style={{ cursor: 'pointer' }}
                        >
                            {value}
                        </div>
                    )
                })}
            </div>

            <div className="row l-distributed l-lastSmall">
                <span>{t('apCost')}</span>
                <span>{getApCost()}</span>
            </div>

            <div className="row l-distributed l-lastSmall">
                <span>{t('aim')}?</span>
                <input 
                    type="checkbox" 
                    className="themed-svg" 
                    data-icon="attack"
                    checked={isAiming}
                    onChange={(e) => setIsAiming(e.target.checked)}
                    aria-label="Aim" 
                />
            </div>

            <div className="row l-distributed l-lastSmall">
                <span>{t('luckCost')}</span>
                <div className="row l-centered">
                    <span>{getLuckCost()} / {currentLuck}</span>
                </div>
            </div>

            <hr />

            <span className="h3">{t('successes')}: {getSuccesses()}</span>

            <hr />

            <footer>
                <button
                    className="popup__button-confirm"
                    onClick={handleRoll}
                    disabled={hasRolled && (diceActive.filter(Boolean).length === 0 || getLuckCost() > currentLuck)}
                >
                    {t(hasRolled ? 'reroll' : 'roll')}
                </button>
                {weaponData && (
                    <button
                        className="popup__button-confirm"
                        onClick={() => {
                            showD6Popup(weaponData.ID, isAiming)
                        }}
                        disabled={!hasRolled || !hasEnoughAmmo()}
                    >
                        {t('damage') || 'Danno'}
                    </button>
                )}
                <button className="popup__button-close" onClick={handleClose}>{t('close')}</button>
            </footer>
            </div>
        </dialog>
    )
}

export default D20Popup
