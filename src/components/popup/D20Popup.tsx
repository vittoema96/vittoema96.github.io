import { useState, useMemo } from 'react';
import { MYSTERIOUS_STRANGER, useCharacter } from '@/contexts/CharacterContext'
import { useTranslation } from 'react-i18next'
import { CharacterItem, RawCharacter, CompanionData, TraitId } from '@/types';
import {
    COMPANION_SPECIAL,
    CompanionSkillType,
    CompanionSpecialType,
    getSpecialFromSkill,
    getSpecialFromSkillCompanion, isCharacterSkill,
    SkillType,
    SPECIAL,
    SpecialType,
} from '@/services/character/utils.ts';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';
import useDice from '@/utils/useDice.ts';
import { Dice } from '@/components/popup/D6Popup.tsx';


export type RollerType = 'companion' | 'mysteriousStranger'

interface SimpleRoller {
    special: Record<CompanionSpecialType, number>;
    skills: Record<CompanionSkillType, number>;
    items: CharacterItem[];
}
interface CharacterRoller {
    special: Record<SpecialType, number>;
    skills: Record<SkillType, number>;
    specialties: SkillType[];
    items: CharacterItem[];
    companion?: CompanionData | undefined;
}
type Roller = (SimpleRoller | CharacterRoller) & {
    traits?: TraitId[] | undefined;
    currentLuck?: number | undefined;
}

function D20Popup({ skillId, usingItem, roller, onClose }: Readonly<{
    skillId: SkillType | CompanionSkillType;
    roller: RollerType | undefined; // undefined means the player
    usingItem: CharacterItem | null;
    onClose: () => void;
}>) {
    const { t } = useTranslation()
    const dataManager = getGameDatabase()
    const { showD6Popup } = usePopup()

    let { character, updateCharacter }: {
        character: Roller;
        updateCharacter: (c: Partial<RawCharacter>) => void;
    } = useCharacter()

    const currentLuck = character.currentLuck ?? 0
    // Handle updates and character when roller is not undefined
    const isCompanion = roller === 'companion'
    const isMysteriousStranger = roller === 'mysteriousStranger'
    if(roller){
        if (isCompanion && character.companion) {
            character = character.companion ;
        } else if (isMysteriousStranger) {
            character = MYSTERIOUS_STRANGER;
        }
    }

    // Get weapon data with mods applied
    const itemData = getModifiedItemData(usingItem)

    // State
    const [isUsingLuck, setIsUsingLuck] = useState(false)
    const [isAiming, setIsAiming] = useState(false)
    const [hasRolled, setHasRolled] = useState(false)

    const diceNumber = isMysteriousStranger ? 3 : (isCompanion ? 2 : 5)
    const [
        diceValues, setDiceValues,
        diceActive, setDiceActive,
        diceRerolled, setDiceRerolled
    ] = useDice(
        diceNumber,
        // if non-character, roll all and don't allow reroll
        roller ? diceNumber : 2,
        roller ? diceNumber : 0
    )

    const [initialApCost, setInitialApCost] = useState(0)


    const [selectedSpecial, setSelectedSpecial] = useState(
        isCompanion
            ? getSpecialFromSkillCompanion(skillId as CompanionSkillType)
            : (getSpecialFromSkill(skillId as SkillType) || 'strength')
    )
    const activeSpecialId = isUsingLuck ? 'luck' : selectedSpecial

    let specialValue
    let skillValue
    let hasSpecialty = false
    if(isCharacterSkill(skillId)){
        character = character as CharacterRoller;
        specialValue = character.special[activeSpecialId as SpecialType]
        skillValue = character.skills[skillId]
        hasSpecialty = character.specialties.includes(skillId)
    } else {
        character = character as SimpleRoller;
        specialValue = character.special[activeSpecialId as CompanionSpecialType]
        skillValue = character.skills[skillId]
    }
    const targetNumber = skillValue + specialValue
    const criticalValue = hasSpecialty ? skillValue : 1

    const extraComplications = []
    let baseComplication = 20
    if(dataManager.isType(itemData, "weapon")){
        if(itemData.QUALITIES.includes('qualityUnreliable')) {
            extraComplications.push(19)
        }
        if(character.traits?.includes('traitHeavyHanded')
            && ['meleeWeapons', 'unarmed'].includes(skillId)) {
            baseComplication -= 1
        }
    }
    const complicationValue = Math.min(baseComplication, ...extraComplications)

    // AP Cost calculation
    // Relevant only for roller = undefined
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
        // Companion and Mysterious Stranger do not spend Luck or reroll dice
        if (roller) {
            if(isMysteriousStranger && !hasRolled) {
                return 1
            }
            return 0
        }
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
    }, [diceActive, diceRerolled, isAiming, isUsingLuck, hasRolled, roller])

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

    const handleDiceClick = (index: number) => {
        // Companion and Mysterious Stranger rolls use fixed dice; no editing
        // After roll: only allow clicking on non '?' non rerolled dice
        if (roller || (
            hasRolled
            && (diceValues[index] === '?' || diceRerolled[index])
        )) {
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
        // Companion and Mysterious Stranger roll only once
        if (roller && hasRolled) {
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

        setInitialApCost(getApCost())

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
        setDiceActive(Array.from(diceActive).fill(false))

        // Update luck AFTER setting hasRolled to true
        if (luckCost > 0) {
            updateCharacter({ currentLuck: currentLuck - luckCost  })
        }
    }

    if (!skillId) {return null}

    function toggleAiming(checked: boolean) {
        if(dataManager.isType(itemData, "weapon")
            && itemData.QUALITIES.includes('qualityInaccurate')) {
            return
        }
        setIsAiming(checked)
    }

    return (
        <BasePopup
            title={skillId}
            onClose={onClose}
            footerChildren={
                <>
                    {/* Reroll button  */}
                    {(!roller || !hasRolled) && <button
                        className="confirmButton"
                        onClick={handleRoll}
                        disabled={hasRolled && (diceActive.filter(Boolean).length === 0 || luckCost > currentLuck)}
                    >
                        {t(hasRolled ? 'reroll' : 'roll')}
                    </button>}

                    {/* Damage button */}
                    {itemData && (!roller || hasRolled) && (
                        <button
                            className="confirmButton"
                            onClick={() => {
                                if (!usingItem) {return}
                                const damageItem = usingItem || { id: itemData.ID, quantity: 1, equipped: false, mods: [] }
                                showD6Popup(damageItem, isAiming, isMysteriousStranger || isCompanion)
                            }}
                            /* TODO Companions SHOULD use ammo too */
                            disabled={!hasRolled}
                        >
                            {t('damage')}
                        </button>
                    )}
                </>
            }
        >

                { /* Special selection + checkbox */ }
                <div className="row l-lastSmall">
                    <select
                        value={isUsingLuck ? 'luck' : selectedSpecial}
                        onChange={(e) => setSelectedSpecial(e.target.value as SpecialType)}
                        disabled={hasRolled || isUsingLuck || isMysteriousStranger}
                        aria-label="Special to use?"
                    >
                        {/* TODO COMPANION not all companions have mind/body, some have normal specials */}
                        {(isCharacterSkill(skillId) ? SPECIAL : COMPANION_SPECIAL).map(specialValue => (
                            <option key={specialValue} value={specialValue}>
                                {t(specialValue)}
                            </option>
                        ))}
                    </select>
                    {!roller && <input
                        type="checkbox"
                        className="themed-svg"
                        data-icon="luck"
                        checked={isUsingLuck}
                        onChange={(e) => setIsUsingLuck(e.target.checked)}
                        disabled={hasRolled}
                        aria-label="Use Luck"
                    />}
                </div>

                <hr />

                <div className={"stack no-gap"}>
                    <span className="h2">Target: {targetNumber}</span>
                    <span className="h5">{skillValue} (Skill) + {specialValue} ({t(activeSpecialId)})</span>
                    <span className="h5">Critical Hit: Roll {criticalValue > 1 ? `≤` : `=`} {criticalValue}</span>
                </div>

                <hr />

                <div className={"row "} style={{
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {diceValues.map((value, index) => (
                        <D20Die
                            key={index}
                            value={value}
                            minComplication={complicationValue}
                            maxCritical={criticalValue}
                            isActive={diceActive[index]!}
                            isRerolled={diceRerolled[index]!}
                            onClick={() => handleDiceClick(index)}
                            biggerDie={isMysteriousStranger || isCompanion || index < 2}/>
                    ))}
                </div>


                {
                    !isMysteriousStranger && !isCompanion && // TODO can a companion aim?
                    <>
                        <div className="row l-distributed l-lastSmall">
                            <span>{t('apCost')}</span>
                            <span>{getApCost()}</span>
                        </div>

                        <div className="row l-distributed l-lastSmall">
                            <span>{t('aim')}?</span>
                            <div>
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
                        </div>
                    </>
                }
                {
                    !isCompanion && <div className="row l-distributed l-lastSmall">
                        <span>{t('luckCost')}</span>
                        <div className="row l-centered">
                            <span>{luckCost} / {currentLuck}</span>
                        </div>
                    </div>
                }


                <hr />

                <span className="h3">{t('successes')}: {getSuccesses()}</span>
        </BasePopup>
    )
}


function D20Die({ value, minComplication, maxCritical, isActive, isRerolled, biggerDie, onClick }: Readonly<{
    value: number | '?',
    minComplication: number,
    maxCritical: number,
    isActive: boolean,
    isRerolled: boolean,
    biggerDie: boolean,
    onClick: () => void
}>) {
    const getDiceClass = (val: number | '?') => {
        if(val === '?') { return '' }
        if (val >= minComplication) {
            return 'roll-complication' // Critical fail
        } else if (val <= maxCritical) {
            return 'roll-crit' // Critical hit
        }
        return ''
    }
    return (
        <Dice
            value={value}
            baseClass={'d20-dice'}
            getClassFromValue={getDiceClass}
            isActive={isActive}
            isRerolled={isRerolled}
            extraStyle={biggerDie ? {} : {transform: "scale(0.8)"}}
            onClick={onClick}/>
    )
}

export default D20Popup
