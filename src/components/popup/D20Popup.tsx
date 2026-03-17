import { useState, useRef, useMemo } from 'react'
import { useCharacter } from '@/contexts/CharacterContext'
import { useTranslation } from 'react-i18next'
import { useDialog } from '@/hooks/useDialog'
import { hasEnoughAmmo } from '@/utils/itemUtils';
import { CharacterItem, SkillType, SPECIAL, COMPANION_SPECIAL, SpecialType, WeaponItem, CompanionSkillType } from '@/types';
import {SKILL_TO_SPECIAL_MAP} from "@/utils/characterSheet";
import { COMPANION_SKILL_TO_SPECIAL_MAP } from '@/utils/companionTypes';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import PopupHeader from '@/components/popup/common/PopupHeader.tsx';
import DialogPortal from '@/components/popup/common/DialogPortal.tsx';

export type RollerType = 'companion' | 'mysteriousStranger'

interface D20PopupProps {
    onClose: () => void;
    skillId: SkillType;
    usingItem: CharacterItem | null;
    roller?: RollerType;
    onShowDamage?: (usingItem: CharacterItem, hasAimed: boolean, isMysteriousStrangerOrCompanion: boolean) => void;
}

function D20Popup({ onClose, skillId, usingItem = null, roller, onShowDamage }: Readonly<D20PopupProps>) {
    const { t } = useTranslation()
    const dialogRef = useRef<HTMLDialogElement>(null)
    const { character, updateCharacter } = useCharacter()
    const dataManager = getGameDatabase()

    const rollerCharacter = character

    const itemData = usingItem
        ? getModifiedItemData(usingItem)
        : null

    const isMysteriousStranger = roller === 'mysteriousStranger'
    const isCompanion = roller === 'companion'
    const isSpecialRoller = isMysteriousStranger || isCompanion
    const skill = skillId

    const getSpecialDisplayName = (specialType: SpecialType): string => {
        return t(specialType)
    }

    const [isUsingLuck, setIsUsingLuck] = useState(false)
    const [selectedSpecial, setSelectedSpecial] = useState(
        isCompanion
            ? COMPANION_SKILL_TO_SPECIAL_MAP[skill as CompanionSkillType]
            : (SKILL_TO_SPECIAL_MAP[skill] || 'strength')
    )
    const [isAiming, setIsAiming] = useState(false)
    const [hasRolled, setHasRolled] = useState(false)
    const [diceValues, setDiceValues] = useState<Array<string | number>>(
        isMysteriousStranger ? ['?', '?', '?'] : isCompanion ? ['?', '?'] : ['?', '?', '?', '?', '?']
    )
    const [diceActive, setDiceActive] = useState(
        isMysteriousStranger ? [true, true, true] : isCompanion ? [true, true] : [true, true, false, false, false]
    )
    const [diceRerolled, setDiceRerolled] = useState(
        isMysteriousStranger ? [false, false, false] : isCompanion ? [false, false] : [false, false, false, false, false])
    const [initialApCost, setInitialApCost] = useState(0)

    const activeSpecialId = isUsingLuck ? 'luck' : selectedSpecial
    const skillValue = rollerCharacter.skills[skill]
    const hasSpecialty = rollerCharacter.specialties.includes(skill) || isMysteriousStranger
    const specialValue = rollerCharacter.special[activeSpecialId]
    const targetNumber = skillValue + specialValue
    const criticalValue = hasSpecialty ? skillValue : 1
    const currentLuck = rollerCharacter.currentLuck

    const getApCost = () => {
        if (hasRolled) {
            return initialApCost
        }
        const activeDiceCount = diceActive.filter(Boolean).length
        switch (activeDiceCount) {
            case 5: return 6
            case 4: return 3
            case 3: return 1
            default: return 0
        }
    }

    const luckCost = useMemo(() => {
        if (isSpecialRoller) {
            return 0
        }
        if (hasRolled) {
            const rerollingCount = diceActive.filter(Boolean).length;
            const rerolledCount = diceRerolled.filter(Boolean).length;
            let luckCost = rerollingCount;

            if (isAiming && rerolledCount === 0) {
                luckCost -= 1;
            }
            return Math.max(0, luckCost);
        } else {
            return isUsingLuck ? 1 : 0;
        }
    }, [diceActive, diceRerolled, isAiming, isUsingLuck, hasRolled, isSpecialRoller])

    const getSuccesses = () => {
        if (!hasRolled) {return '?'}

        let successes = 0

        diceValues.forEach((value) => {
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

    const getDiceClass = (value: string | number) => {
        if (typeof value !== 'number') {return ''}

        const extraComplications = []
        let baseComplication = 20
        if(dataManager.isType(itemData, "weapon")){
            if(itemData.QUALITIES?.includes('qualityUnreliable')) {
                extraComplications.push(19)
            }
            if(rollerCharacter.traits.includes('traitHeavyHanded')
                && ['meleeWeapons', 'unarmed'].includes(skill)) {
                baseComplication -= 1
            }
        }

        if (value >= Math.min(baseComplication, ...extraComplications)) {
            return 'roll-complication'
        } else if (value <= criticalValue) {
            return 'roll-crit'
        }

        return ''
    }

    const handleDiceClick = (index: number) => {
        if (isSpecialRoller) {
            return
        }
        if (hasRolled && (diceValues[index] === '?' || diceRerolled[index])) {
            return
        }

        setDiceActive(prev => {
            const newActive = [...prev]

            if (hasRolled) {
                newActive[index] = !prev[index]
            } else {
                const willBeActive = !prev[index]

                for(let i=0; i<newActive.length; i++) {
                    const alwaysActive = i <= 1;
                    if(i < index) {
                        newActive[i] = true
                    } else if (i === index) {
                        newActive[i] = alwaysActive || willBeActive
                    } else {
                        newActive[i] = alwaysActive
                    }
                }
            }
            return newActive
        })
    }

    const handleRoll = () => {
        if (isSpecialRoller && hasRolled) {
            return
        }
        const activeDiceCount = diceActive.filter(Boolean).length
        if (activeDiceCount === 0) {
            alert(t('selectDiceAlert') || 'Select at least one die!')
            return
        }

        if (currentLuck < luckCost) {
            alert(t('notEnoughLuckAlert') || 'Not enough luck!')
            return
        }

        if (!hasRolled) {
            const apCost = getApCost()
            setInitialApCost(apCost)
        }

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

        setDiceActive([false, false, false, false, false])

        let totalLuckCost = luckCost

        if (isMysteriousStranger && !hasRolled) {
            totalLuckCost += 1
        }

        if (totalLuckCost > 0) {
            updateCharacter({ currentLuck: currentLuck - totalLuckCost })
        }
    }

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
        <DialogPortal>
        <dialog ref={dialogRef}>
        <PopupHeader title={skillId} onClose={() => closeWithAnimation()}/>

        <div className="row l-lastSmall">
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
                disabled={hasRolled || isUsingLuck || isMysteriousStranger || isCompanion}
                aria-label="Special to use?"
                style={{ width: '100%' }}
            >
                {(isCompanion ? COMPANION_SPECIAL : SPECIAL).map(specialValue => (
                    <option key={specialValue} value={specialValue}>
                        {getSpecialDisplayName(specialValue as SpecialType)}
                    </option>
                ))}
            </select>
            {!isMysteriousStranger && !isCompanion && <input
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
            <span className="h5">{skillValue} (Skill) + {specialValue} ({getSpecialDisplayName(activeSpecialId)})</span>
            <span className="h5">Critical Hit: Roll {criticalValue > 1 ? `≤` : `=`} {criticalValue}</span>
        </div>

        <hr />

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                minHeight: '4rem'
            }}>
            {diceValues.map((value, index) => {
                const diceClass = getDiceClass(value)
                return (
                        <div
                        key={index}
                        className={`d20-dice dice ${diceActive[index] ? 'active' : ''} ${diceRerolled[index] ? 'rerolled' : ''} ${diceClass}`}
                        onClick={() => handleDiceClick(index)}
                        style={{
                                cursor: (isMysteriousStranger || isCompanion) ? 'default' : 'pointer',
                                ...(isMysteriousStranger || isCompanion || index < 2 ? {} : { transform: 'scale(0.8)' })
                        }}
                    >
                        {value}
                    </div>
                )
            })}
        </div>

            {
                !isMysteriousStranger && !isCompanion &&
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

            <footer style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                {(!isSpecialRoller || !hasRolled) && <button
                className="popup__button-confirm"
                onClick={handleRoll}
                disabled={hasRolled && (diceActive.filter(Boolean).length === 0 || luckCost > currentLuck)}
                style={{ flex: '1 1 auto', minWidth: '8rem' }}
            >
                {t(hasRolled ? 'reroll' : 'roll')}
            </button>}
            {itemData && (!isSpecialRoller || hasRolled) && (
                <button
                    className="popup__button-confirm"
                    onClick={() => {
                        if (!onShowDamage) {return}
                        const damageItem = usingItem || { id: itemData.ID, quantity: 1, equipped: false, mods: [] }
                        onShowDamage(damageItem, isAiming, isMysteriousStranger || isCompanion)
                    }}
                    disabled={!hasRolled || ((isMysteriousStranger || isCompanion) ? false : !hasEnoughAmmo(itemData, character))}
                    style={{ flex: '1 1 auto', minWidth: '8rem' }}
                >
                    {t('damage')}
                </button>
            )}
            <button
                className="popup__button-close"
                onClick={() => closeWithAnimation()}
                style={{ flex: '1 1 auto', minWidth: '8rem' }}
            >
                {t('close')}
            </button>
        </footer>
    </dialog>
    </DialogPortal>
    )
}

export default D20Popup

