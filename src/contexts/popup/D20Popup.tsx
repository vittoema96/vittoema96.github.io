import { useState, useRef, useMemo } from 'react'
import { useCharacter } from '@/contexts/CharacterContext'
import { useTranslation } from 'react-i18next'
import { usePopup } from '@/contexts/popup/PopupContext'
import { useDialog } from '@/hooks/useDialog'
import { hasEnoughAmmo } from '@/utils/itemUtils';
import { CharacterItem, SkillType, SPECIAL, SpecialType, WeaponItem } from '@/types';
import {SKILL_TO_SPECIAL_MAP} from "@/utils/characterSheet";
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { FitText } from '@/app/FitText.tsx';


interface D20PopupProps {
    onClose: () => void;
    skillId: SkillType | 'perkMysteriousStranger';
    usingItem: CharacterItem | null;
}

function D20Popup({ onClose, skillId, usingItem = null}: Readonly<D20PopupProps>) {
    const { t } = useTranslation()
    const dialogRef = useRef<HTMLDialogElement>(null)
    const { character, updateCharacter } = useCharacter()
    const { showD6Popup } = usePopup()
    const dataManager = getGameDatabase()

    // Get weapon data with mods applied
    const itemData = usingItem
        ? getModifiedItemData(usingItem)
        : null

    const isMysteriousStranger = skillId === 'perkMysteriousStranger'
    const skill = isMysteriousStranger ? 'smallGuns' : skillId
    // State
    const [isUsingLuck, setIsUsingLuck] = useState(false)
    const [selectedSpecial, setSelectedSpecial] = useState(SKILL_TO_SPECIAL_MAP[skill] || 'strength')
    const [isAiming, setIsAiming] = useState(false)
    const [hasRolled, setHasRolled] = useState(false)
    const [diceValues, setDiceValues] = useState<Array<string | number>>(
        isMysteriousStranger ? ['?', '?', '?'] : ['?', '?', '?', '?', '?']
    )
    const [diceActive, setDiceActive] = useState(
        isMysteriousStranger ? [true, true, true] : [true, true, false, false, false]
    )
    const [diceRerolled, setDiceRerolled] = useState(
        isMysteriousStranger ? [true, true, true] : [false, false, false, false, false])
    const [initialApCost, setInitialApCost] = useState(0) // Store AP cost from first roll

    // Calculations
    const skillValue = isMysteriousStranger ? 6 : character.skills[skill]
    const hasSpecialty = isMysteriousStranger || character.specialties.includes(skill)
    const activeSpecialId = isUsingLuck ? 'luck' : selectedSpecial
    const specialValue = isMysteriousStranger ? 10 : character.special[activeSpecialId]
    const targetNumber = skillValue + specialValue
    const criticalValue = hasSpecialty ? skillValue : 1
    const currentLuck = character.currentLuck

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

    const luckCost = useMemo(() => {
        if (hasRolled) {
            const rerollingCount = diceActive.filter(Boolean).length;
            const rerolledCount = diceRerolled.filter(Boolean).length;
            let luckCost = rerollingCount;

            // First reroll is free with aiming
            if (isAiming && rerolledCount === 0) {
                luckCost -= 1;
            }
            return Math.max(0, luckCost);
        } else {
            return isUsingLuck ? 1 : 0;
        }
    }, [diceActive, diceRerolled, isAiming, isUsingLuck, hasRolled])

    // Success calculation
    const getSuccesses = () => {
        if (!hasRolled) {return '?'}

        let successes = 0

        diceValues.forEach((value) => {
            // Count successes only for rolled dice (not '?')
            const nVal = Number(value)
            if (nVal <= targetNumber) {
                successes++
            }
            if(nVal <= criticalValue) {
                successes++
            }
        })

        return successes
    }

    // Get dice class based on value
    const getDiceClass = (value: string | number) => {
        if (typeof value !== 'number') {return ''}

        if (value === 20) {
            return 'roll-complication' // Critical fail (20)
        } else if (value <= criticalValue) {
            return 'roll-crit' // Critical hit
        }

        return ''
    }

    const handleDiceClick = (index: number) => {
        // After roll: only allow clicking on rolled dice (not '?')
        if (hasRolled && (diceValues[index] === '?' || diceRerolled[index])) {
            return // Can't select unrolled dice
        }

        setDiceActive(prev => {
            const newActive = [...prev]

            if (hasRolled) { // After roll: simple toggle for rolled dice
                newActive[index] = !prev[index]
            } else { // Before roll: cascade selection logic
                const willBeActive = !prev[index]

                for(let i=0; i<newActive.length; i++) {
                    // Special case: die 0 and 1 can't be deselected
                    const alwaysActive = i <= 1;
                    if(i < index) {
                        newActive[i] = true // Select all previous
                    } else if (i === index) {
                        newActive[i] = alwaysActive || willBeActive // Toggle clicked
                    } else {
                        newActive[i] = alwaysActive // Deselect all after
                    }
                }
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

    // Use dialog hook for dialog management
    const { closeWithAnimation } = useDialog(dialogRef, onClose)

    if (!skill) {return null}

    function toggleAiming(checked: boolean) {
        if(dataManager.isType(itemData, "weapon")
              && (itemData as WeaponItem).QUALITIES?.includes('qualityInaccurate')) {
            return
        }
        setIsAiming(checked)
    }

    return (
        <dialog
            ref={dialogRef}
            style={{
                zIndex: 10000,
                position: 'fixed'
            }}
        >
            <div>
                <div style={{ gap: '1rem', padding: '0.5rem', display: 'flex'}} className="l-lastSmall">
                    <FitText minSize={20} maxSize={40}>
                        {t(skill)}
                    </FitText>
                    <button className="popup__button-x" onClick={() => closeWithAnimation()}>&times;</button>
                </div>

                <div className="l-lastSmall row">
                    <select
                        value={isUsingLuck ? 'luck' : selectedSpecial}
                        onChange={(e) => {
                            const value = e.target.value
                            if (value === 'luck') {
                                setIsUsingLuck(true)
                            } else {
                                setIsUsingLuck(false)
                                setSelectedSpecial(value as SpecialType)
                            }
                        }}
                        disabled={hasRolled || isUsingLuck || isMysteriousStranger}
                        aria-label="Special to use?"
                        style={{ width: '100%' }}
                    >
                        {SPECIAL.map(specialValue => (
                            <option key={specialValue} value={specialValue}>
                                {t(specialValue)}
                            </option>
                        ))}
                    </select>
                    {!isMysteriousStranger && <input
                        type="checkbox"
                        className="themed-svg"
                        data-icon="luck"
                        checked={isUsingLuck}
                        onChange={(e) => {
                            setIsUsingLuck(e.target.checked)
                        }}
                        disabled={hasRolled}
                        aria-label="Use Luck"
                    />}
                </div>

                <hr />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span className="h2">Target: {targetNumber}</span>
                    <span className="h5">{skillValue} (Skill) + {specialValue} ({t(activeSpecialId) || activeSpecialId})</span>
                    <span className="h5">Critical Hit: Roll {criticalValue > 1 ? `≤` : `=`} {criticalValue}</span>
                </div>

                <hr />

                <div className="row l-spaceBetween">
                    {diceValues.map((value, index) => {
                        const diceClass = getDiceClass(value)
                        return (
                            <div
                                key={index}
                                className={`d20-dice dice ${diceActive[index] ? 'active' : ''} ${diceRerolled[index] ? 'rerolled' : ''} ${diceClass}`}
                                onClick={() => handleDiceClick(index)}
                                style={{
                                    cursor: 'pointer',
                                    ...(isMysteriousStranger || index < 2 ? {} : { transform: 'scale(0.8)' })
                                }}
                            >
                                {value}
                            </div>
                        )
                    })}
                </div>


                {
                    !isMysteriousStranger &&
                    <>
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
                                disabled={hasRolled}
                                onChange={(e) => toggleAiming(e.target.checked)}
                                aria-label="Aim"
                            />
                        </div>

                        <div className="row l-distributed l-lastSmall">
                            <span>{t('luckCost')}</span>
                            <div className="row l-centered">
                                <span>{luckCost} / {currentLuck}</span>
                            </div>
                        </div>
                    </>
                }

                <hr />

                <span className="h3">{t('successes')}: {getSuccesses()}</span>

                <hr />

                <footer>
                    {(!isMysteriousStranger || !hasRolled) && <button
                        className="popup__button-confirm"
                        onClick={handleRoll}
                        disabled={hasRolled && (diceActive.filter(Boolean).length === 0 || luckCost > currentLuck)}
                    >
                        {t(hasRolled ? 'reroll' : 'roll')}
                    </button>}
                    {itemData && (!isMysteriousStranger || hasRolled) && (
                        <button
                            className="popup__button-confirm"
                            onClick={() => {
                                showD6Popup(usingItem || { id: itemData.ID, quantity: 1, equipped: false, mods: [] }, isAiming, isMysteriousStranger)
                            }}
                            disabled={!hasRolled || (isMysteriousStranger ? false : !hasEnoughAmmo(itemData, character))}
                        >
                            {t('damage')}
                        </button>
                    )}
                    <button className="popup__button-close" onClick={() => closeWithAnimation()}>{t('close')}</button>
                </footer>
            </div>
        </dialog>
    )
}

export default D20Popup
