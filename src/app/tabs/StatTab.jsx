import React, { useState } from 'react'
import { SPECIAL } from '../../js/constants.js'
import { usePopup } from '../../contexts/PopupContext.jsx'
import { t } from 'i18next'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { useSpecialStats } from '../../hooks/useSpecialStats.js'
import { useSkills } from '../../hooks/useSkills.js'
import Skill from './Skill.jsx'
import DamageReductionDisplay from '../../components/stats/DamageReductionDisplay.jsx'
import EquippedArmorEffects from '../../components/inventory/EquippedArmorEffects.jsx'
import SpecialStat from '../../components/common/SpecialStat.jsx'

function StatTab() {
    const [isEditing, setIsEditing] = useState(false)
    const { showConfirm } = usePopup()
    const { character, derivedStats } = useCharacter()
    const { incrementSpecial, replenishLuck } = useSpecialStats()
    const { sortedSkills } = useSkills()

    // Get derived stats from context (already calculated)
    const { defense, initiative, meleeDamage } = derivedStats

    // Handle SPECIAL stat changes (click to increment in edit mode)
    const handleSpecialClick = (specialName) => {
        if (!isEditing) return
        incrementSpecial(specialName)
    }

    // Handle current luck replenish
    const handleLuckReplenish = () => {
        if (!isEditing) {
            showConfirm(t('replenishLuckConfirm'), replenishLuck)
        }
    }

    // Toggle edit mode
    const toggleEditMode = () => {
        setIsEditing(!isEditing)
    }


    return (
        <section className="tabContent">
            {/* SPECIAL Stats */}
            <div id="c-special">
                {Object.entries(character.special).map(([specialName, specialValue]) => (
                    <SpecialStat
                        key={specialName}
                        name={t(specialName)}
                        value={specialValue}
                        onClick={() => handleSpecialClick(specialName)}
                        editable={isEditing}
                    >
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
                    </SpecialStat>
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
            <button className="button" onClick={toggleEditMode}>
                {isEditing ? t('stopEditing') : t('editStats')}
            </button>
        </section>
    )
}

export default StatTab