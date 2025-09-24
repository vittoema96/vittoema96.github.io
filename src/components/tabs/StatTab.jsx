import React, { useState } from 'react'
import { SPECIAL, SKILLS, SKILL_TO_SPECIAL_MAP } from '../../js/constants.js'
import { getDefense, getInitiative, getMeleeDamage } from '../../js/gameRules.js'
import { useI18n } from '../../hooks/useI18n.js'
import Skill from './Skill.jsx'

function StatTab({ character, updateCharacter }) {
    const [isEditing, setIsEditing] = useState(false)
    const t = useI18n()

    // Calculate derived stats
    const defense = getDefense(character)
    const initiative = getInitiative(character)
    const meleeDamage = getMeleeDamage(character)

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

    // Handle skill changes (click to increment in edit mode)
    const handleSkillClick = (skillName) => {
        if (!isEditing) return

        const current = character.skills[skillName]
        const max = getSkillMax(character.origin)
        const next = current < max ? current + 1 : 0 // Cycle back to 0 if at max

        updateCharacter({
            skills: {
                ...character.skills,
                [skillName]: next
            }
        })
    }

    // Handle specialty checkbox changes
    const handleSpecialtyChange = (skillName, checked) => {
        if (!isEditing) return

        const currentSpecialties = character.specialties || []
        const newSpecialties = checked
            ? [...currentSpecialties, skillName]
            : currentSpecialties.filter(s => s !== skillName)

        updateCharacter({ specialties: newSpecialties })
    }

    // Handle current luck replenish
    const handleLuckReplenish = () => {
        if (!isEditing) {
            if (confirm(t('replenishLuckConfirm'))) {
                updateCharacter({ currentLuck: character.special[SPECIAL.LUCK] })
            }
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

    // Get skill maximum based on origin
    const getSkillMax = (origin) => {
        return origin === 'superMutant' ? 4 : 6
    }

    // Create sorted skills list (like original)
    const sortedSkills = Object.values(SKILLS)
        .map(skillId => ({
            skillId,
            translatedName: getSkillDisplayName(skillId)
        }))
        .sort((a, b) => a.translatedName.localeCompare(b.translatedName))

    // Get display name for skill (using i18n)
    function getSkillDisplayName(skillId) {
        return t(skillId)
    }

    // Get display name for SPECIAL (using i18n)
    function getSpecialDisplayName(specialId) {
        return t(specialId)
    }

    return (
        <section id="stat-tabContent" className="tabContent">
            {/* SPECIAL Stats */}
            <div id="c-special">
                {Object.entries(character.special).map(([specialName, specialValue]) => (
                    <div
                        key={specialName}
                        className="special"
                        data-special={specialName}
                        onClick={() => handleSpecialClick(specialName)}
                        style={{ cursor: isEditing ? 'pointer' : 'default' }}
                    >
                        <span className="special__name" data-i18n={specialName}>
                            {getSpecialDisplayName(specialName)}
                        </span>
                        <span className="special__value" id={`special__value-${specialName}`}>
                            {specialValue}
                        </span>

                        {/* Current Luck sub-special for Luck stat */}
                        {specialName === SPECIAL.LUCK && (
                            <div
                                id="sub-special"
                                className="themed-svg sub-special"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleLuckReplenish()
                                }}
                                style={{ cursor: !isEditing ? 'pointer' : 'default' }}
                            >
                                <span className="special__value" id="luck-current-value">
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
                    <span id="defense-value">{defense}</span>
                </div>
                <div className="derived-stat">
                    <span>{t('initiative')}</span>
                    <span id="initiative-value">{initiative}</span>
                </div>
                <div className="derived-stat">
                    <span>{t('melee-damage')}</span>
                    <span id="melee-damage-value">+{meleeDamage}</span>
                </div>
            </div>

            {/* Skills Section */}
            <div>
                <h1 className="form-label">Skills:</h1>
                <section
                    id="skills"
                    className="itemlist"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                    }}
                >
                    {sortedSkills.map(({ skillId }) => {
                        const skillValue = character.skills[skillId] || 0
                        const specialName = SKILL_TO_SPECIAL_MAP[skillId]
                        const hasSpecialty = character.specialties?.includes(skillId) || false

                        return (
                            <Skill
                                key={skillId}
                                skillId={skillId}
                                skillValue={skillValue}
                                specialName={specialName}
                                hasSpecialty={hasSpecialty}
                                isEditing={isEditing}
                                onSkillClick={handleSkillClick}
                                onSpecialtyChange={handleSpecialtyChange}
                                getSkillDisplayName={getSkillDisplayName}
                                getSpecialDisplayName={getSpecialDisplayName}
                            />
                        )
                    })}
                </section>
            </div>

            {/* Edit Stats Button */}
            <button
                id="edit-stats-button"
                data-i18n={isEditing ? "stopEditing" : "editStats"}
                className="button"
                onClick={toggleEditMode}
            >
                {isEditing ? t('stopEditing') : t('editStats')}
            </button>
        </section>
    )
}

export default StatTab