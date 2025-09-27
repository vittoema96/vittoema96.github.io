import React, { useState, useRef, useEffect } from 'react'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { useI18n } from '../../hooks/useI18n'

const SPECIAL_OPTIONS = [
    { value: 'strength', label: 'Strength' },
    { value: 'perception', label: 'Perception' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'charisma', label: 'Charisma' },
    { value: 'intelligence', label: 'Intelligence' },
    { value: 'agility', label: 'Agility' },
    { value: 'luck', label: 'Luck' }
]

const SKILL_TO_SPECIAL_MAP = {
    athletics: 'strength',
    barter: 'charisma',
    bigGuns: 'strength',
    energyWeapons: 'perception',
    explosives: 'perception',
    lockpick: 'perception',
    medicine: 'intelligence',
    meleeWeapons: 'strength',
    pilot: 'perception',
    repair: 'intelligence',
    science: 'intelligence',
    smallGuns: 'agility',
    sneak: 'agility',
    speech: 'charisma',
    survival: 'endurance',
    throwing: 'strength',
    unarmed: 'strength'
}

function D20Popup({ isOpen, onClose, skillId }) {
    const dialogRef = useRef(null)
    const t = useI18n()
    const { character, updateCharacter } = useCharacter()

    // State
    const [isUsingLuck, setIsUsingLuck] = useState(false)
    const [selectedSpecial, setSelectedSpecial] = useState(SKILL_TO_SPECIAL_MAP[skillId] || 'strength')
    const [isAiming, setIsAiming] = useState(false)
    const [hasRolled, setHasRolled] = useState(false)
    const [diceValues, setDiceValues] = useState(['?', '?', '?', '?', '?'])
    const [diceActive, setDiceActive] = useState([true, true, false, false, false])
    const [diceRerolled, setDiceRerolled] = useState([false, false, false, false, false])

    // Calculations
    const skillValue = character?.skills?.[skillId] || 0
    const activeSpecialId = isUsingLuck ? 'luck' : selectedSpecial
    const specialValue = character?.special?.[activeSpecialId] || 5
    const targetNumber = skillValue + specialValue
    const hasSpecialty = character?.specialties?.includes(skillId) || false
    const criticalValue = hasSpecialty ? skillValue : 1
    const currentLuck = character?.currentLuck || character?.special?.luck || 5

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
        if (diceValues.some(val => val === '?')) return '?'
        
        let successes = 0
        diceValues.forEach((value, index) => {
            if (diceActive[index] && typeof value === 'number') {
                if (value <= targetNumber) successes++
            }
        })
        return successes
    }

    // Handle dice click
    const handleDiceClick = (index) => {
        if (hasRolled) {
            setDiceActive(prev => {
                const newActive = [...prev]
                newActive[index] = !newActive[index]
                return newActive
            })
        }
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

        // Update luck
        if (luckCost > 0) {
            updateCharacter({ currentLuck: currentLuck - luckCost })
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

        // Reset dice selection for reroll
        if (hasRolled) {
            setDiceActive([false, false, false, false, false])
        }
    }

    // Handle close
    const handleClose = () => {
        // Reset state
        setIsUsingLuck(false)
        setSelectedSpecial(SKILL_TO_SPECIAL_MAP[skillId] || 'strength')
        setIsAiming(false)
        setHasRolled(false)
        setDiceValues(['?', '?', '?', '?', '?'])
        setDiceActive([true, true, false, false, false])
        setDiceRerolled([false, false, false, false, false])
        onClose()
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
            <header className="l-lastSmall">
                <span 
                    className="h1 h1--margin-top" 
                    style={{ fontSize: getVariableFontSize(skillName) }}
                >
                    {skillName}
                </span>
                <button className="popup__button-x" onClick={handleClose}>&times;</button>
            </header>

            <div className="l-lastSmall row">
                <select 
                    value={selectedSpecial}
                    onChange={(e) => setSelectedSpecial(e.target.value)}
                    disabled={hasRolled || isUsingLuck}
                    aria-label="Special to use?"
                >
                    {SPECIAL_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {t(option.value) || option.label}
                        </option>
                    ))}
                </select>
                <input 
                    type="checkbox" 
                    className="themed-svg" 
                    data-icon="luck"
                    checked={isUsingLuck}
                    onChange={(e) => setIsUsingLuck(e.target.checked)}
                    disabled={hasRolled}
                    aria-label="Use Luck" 
                />
            </div>

            <hr />

            <span className="h2">Target: {targetNumber}</span>
            <span className="h5">{skillValue} (Skill) + {specialValue} ({t(activeSpecialId) || activeSpecialId})</span>
            <span className="h5">Critical Hit: Roll {criticalValue > 1 ? `≤` : `=`} {criticalValue}</span>

            <hr />

            <div className="row">
                {diceValues.map((value, index) => (
                    <div 
                        key={index}
                        className={`d20-dice dice ${diceActive[index] ? 'active' : ''} ${diceRerolled[index] ? 'rerolled' : ''}`}
                        onClick={() => handleDiceClick(index)}
                        style={{ cursor: hasRolled ? 'pointer' : 'default' }}
                    >
                        {value}
                    </div>
                ))}
            </div>

            <div className="row l-distributed l-lastSmall">
                <span>AP Cost</span>
                <span>{getApCost()}</span>
            </div>

            <div className="row l-distributed l-lastSmall">
                <span data-i18n="aimQuestion">Aim?</span>
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
                <span>Luck Cost</span>
                <div className="row l-centered">
                    <span>{getLuckCost()}</span>
                </div>
            </div>

            <hr />

            <span className="h3">Successes: {getSuccesses()}</span>

            <hr />

            <footer>
                <button className="popup__button-confirm" onClick={handleRoll}>
                    {hasRolled ? 'Reroll' : 'Roll'}
                </button>
                <button className="popup__button-close" onClick={handleClose}>Close</button>
            </footer>
        </dialog>
    )
}

export default D20Popup
