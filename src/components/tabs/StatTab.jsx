import React, { useState } from 'react'
import { SPECIAL, SKILLS } from '../../js/constants.js'
import { usePopup } from '../../contexts/PopupContext.jsx'

import { useI18n } from '../../hooks/useI18n.js'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import Skill from './Skill.jsx'
import DamageReductionDisplay from '../stats/DamageReductionDisplay.jsx'
import EquippedArmorEffects from '../inventory/EquippedArmorEffects.jsx'

function StatTab() {
    const [isEditing, setIsEditing] = useState(false)
    const t = useI18n()
    const { showConfirm } = usePopup()
    const { character, derivedStats, updateCharacter } = useCharacter()

    // Get derived stats from context (already calculated)
    const { defense, initiative, meleeDamage } = derivedStats

    // Handle SPECIAL stat changes (click to increment in edit mode)
    const handleSpecialClick = (specialName) => {
        if (!isEditing) return

        const current = character.special[specialName]
        const max = getSpecialMax(specialName, character.origin)
        const next = current < max ? current + 1 : 4 // Cycle back to 4 if at max

        updateCharacter({
            special: {
                ...character.special,
                [specialName]: next
            }
        })

        // Update current luck if luck special changes
        if (specialName === SPECIAL.LUCK && character.currentLuck > next) {
            updateCharacter({ currentLuck: next })
        }
    }

    // Handle current luck replenish
    const handleLuckReplenish = () => {
        if (!isEditing) {
            showConfirm(t('replenishLuckConfirm'), () => {
                updateCharacter({ currentLuck: character.special[SPECIAL.LUCK] })
            })
        }
    }

    // Toggle edit mode
    const toggleEditMode = () => {
        setIsEditing(!isEditing)
    }

    // Get SPECIAL maximum based on origin
    const getSpecialMax = (special, origin) => {
        if (origin === 'superMutant') {
            if (special === SPECIAL.STRENGTH || special === SPECIAL.ENDURANCE) {
                return 12
            } else if (special === SPECIAL.INTELLIGENCE || special === SPECIAL.CHARISMA) {
                return 6
            } else {
                return 10 // Perception, Agility, Luck
            }
        } else {
            return 10 // All other origins: max 10 for all SPECIAL
        }
    }

    // Create sorted skills list (like original)
    const sortedSkills = Object.values(SKILLS)
        .map(skillId => ({
            skillId,
            translatedName: t(skillId)
        }))
        .sort((a, b) => a.translatedName.localeCompare(b.translatedName))


    return (
        <section className="tabContent">
            {/* SPECIAL Stats */}
            <div id="c-special">
                {Object.entries(character.special).map(([specialName, specialValue]) => (
                    <div
                        key={specialName}
                        className="special"
                        onClick={() => handleSpecialClick(specialName)}
                        style={{ cursor: isEditing ? 'pointer' : 'default' }}
                    >
                        <span className="special__name">
                            {t(specialName)}
                        </span>
                        <span className="special__value">
                            {specialValue}
                        </span>

                        {/* Current Luck sub-special for Luck stat */}
                        {specialName === SPECIAL.LUCK && (
                            <div
                                className="themed-svg sub-special"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleLuckReplenish()
                                }}
                                style={{ cursor: !isEditing ? 'pointer' : 'default' }}
                            >
                                <span className="special__value">
                                    {character.currentLuck}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Derived Stats */}
            <div className="row row--spaced">
                <div className="derived-stat">
                    <span>{t('defense')}</span>
                    <span>{defense}</span>
                </div>
                <div className="derived-stat">
                    <span>{t('initiative')}</span>
                    <span>{initiative}</span>
                </div>
                <div className="derived-stat">
                    <span>{t('melee-damage')}</span>
                    <span>+{meleeDamage}</span>
                </div>
            </div>

            {/* Damage Reduction Display */}
            <DamageReductionDisplay />

            {/* Active Effects from Equipped Armor */}
            <EquippedArmorEffects equippedItems={character.items.filter(item => item.equipped === true)} />

            {/* Skills Section */}
            <div>
                <h1 className="form-label">Skills:</h1>
                <section
                    className="itemlist"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                    }}
                >
                    {sortedSkills.map(({ skillId }) => {
                        return (
                            <Skill
                                key={skillId}
                                skillId={skillId}
                                isEditing={isEditing}
                            />
                        )
                    })}
                </section>
            </div>

            {/* Edit Stats Button */}
            <button
                className="button"
                onClick={toggleEditMode}
            >
                {isEditing ? t('stopEditing') : t('editStats')}
            </button>
        </section>
    )
}

export default StatTab