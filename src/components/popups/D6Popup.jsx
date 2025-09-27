import React, { useState, useRef, useEffect } from 'react'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { useI18n } from '../../hooks/useI18n'

function D6Popup({ isOpen, onClose, weaponName, damageRating = 2 }) {
    const dialogRef = useRef(null)
    const t = useI18n()
    const { character, updateCharacter } = useCharacter()

    // State
    const [hasRolled, setHasRolled] = useState(false)
    const [diceValues, setDiceValues] = useState(Array(damageRating).fill('?'))
    const [diceActive, setDiceActive] = useState(Array(damageRating).fill(true))
    const [diceRerolled, setDiceRerolled] = useState(Array(damageRating).fill(false))

    const currentLuck = character?.currentLuck || character?.special?.luck || 5

    // Get variable font size for weapon name
    const getVariableFontSize = (text, maxFontSize = 2, step = 0.25, lineSize = 13) => {
        const rows = Math.ceil(text.length / lineSize)
        if (rows > 1) {
            return `${maxFontSize - rows * step}rem`
        }
        return `${maxFontSize}rem`
    }

    // Luck Cost calculation
    const getLuckCost = () => {
        if (!hasRolled) return 0
        
        const rerollingCount = diceActive.filter(Boolean).length
        return Math.max(0, rerollingCount)
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
                newValues[index] = Math.floor(Math.random() * 6) + 1
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
            setDiceActive(Array(damageRating).fill(false))
        }
    }

    // Calculate total damage
    const getTotalDamage = () => {
        if (diceValues.some(val => val === '?')) return '?'
        
        return diceValues.reduce((total, value) => {
            return total + (typeof value === 'number' ? value : 0)
        }, 0)
    }

    // Handle close
    const handleClose = () => {
        // Reset state
        setHasRolled(false)
        setDiceValues(Array(damageRating).fill('?'))
        setDiceActive(Array(damageRating).fill(true))
        setDiceRerolled(Array(damageRating).fill(false))
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

    // Update dice arrays when damageRating changes
    useEffect(() => {
        if (damageRating !== diceValues.length) {
            setDiceValues(Array(damageRating).fill('?'))
            setDiceActive(Array(damageRating).fill(true))
            setDiceRerolled(Array(damageRating).fill(false))
            setHasRolled(false)
        }
    }, [damageRating, diceValues.length])

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
                    style={{ fontSize: getVariableFontSize(weaponName || 'Weapon') }}
                >
                    {weaponName || 'Weapon Damage'}
                </span>
                <button className="popup__button-x" onClick={handleClose}>&times;</button>
            </header>

            <div className="row">
                {diceValues.map((value, index) => (
                    <div 
                        key={index}
                        className={`d6-dice dice ${diceActive[index] ? 'active' : ''} ${diceRerolled[index] ? 'rerolled' : ''}`}
                        onClick={() => handleDiceClick(index)}
                        style={{ cursor: hasRolled ? 'pointer' : 'default' }}
                    >
                        {value}
                    </div>
                ))}
            </div>

            {hasRolled && (
                <>
                    <hr />
                    <div className="row l-distributed l-lastSmall">
                        <span>Total Damage</span>
                        <span className="h2">{getTotalDamage()}</span>
                    </div>
                    
                    <div className="row l-distributed l-lastSmall">
                        <span>Luck Cost (Reroll)</span>
                        <span>{getLuckCost()}</span>
                    </div>
                </>
            )}

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

export default D6Popup
