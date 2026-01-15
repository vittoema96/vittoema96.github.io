import React, { useMemo } from 'react'
import { t } from 'i18next'
import { usePopup } from '../../contexts/PopupContext.jsx'
import { SKILL_TO_SPECIAL_MAP } from "../../js/constants.js"
import { useCharacter, calculateEffectiveSkillValue } from "../../contexts/CharacterContext.jsx"

function Skill({
    skillId,
    isEditing
}) {
    const { showD20Popup } = usePopup()
    const { character, updateCharacter } = useCharacter()

    // Derived values - recalculated when character changes
    const baseSkillValue = character.skills[skillId] || 0
    const specialName = SKILL_TO_SPECIAL_MAP[skillId]
    const hasSpecialty = character.specialties?.includes(skillId) || false

    // Memoized calculations for performance
    const skillMax = useMemo(() => {
        return character.origin === 'superMutant' ? 4 : 6
    }, [character.origin])

    const effectiveSkillValue = useMemo(() => {
        const value = calculateEffectiveSkillValue(character, skillId)
        return Math.max(0, Math.min(value, skillMax))
    }, [character, skillId, skillMax])

    // Handle skill changes
    const onSkillClick = () => {
        if (!isEditing) {
            showD20Popup(skillId)
            return
        }

        const next = effectiveSkillValue < skillMax ? baseSkillValue + 1 : 0 // Cycle back to 0 if at max

        updateCharacter({
            skills: {
                ...character.skills,
                [skillId]: next
            }
        })
    }

    // Handle specialty checkbox changes
    const onSpecialtyChange = (e) => {
        const checked = e.target.checked
        if (!isEditing) {
            showD20Popup(skillId)
            return
        }

        const currentSpecialties = character.specialties || []
        const newSpecialties = checked
            ? [...currentSpecialties, skillId]
            : currentSpecialties.filter(s => s !== skillId)

        updateCharacter({ specialties: newSpecialties })
    }

    return (
        <div
            className="skill"
            onClick={onSkillClick}
            style={{
                cursor: 'pointer', // Always show pointer since both modes are clickable
                userSelect: 'none' // Prevent text selection on click
            }}
        >
            <span>
                <b>{t(skillId)}</b>
            </span>
            <span>
                <i>[<span>{t(specialName)}</span>]</i>
            </span>
            <span>{effectiveSkillValue}</span>
            <input
                type="checkbox"
                disabled={!isEditing}
                checked={hasSpecialty}
                onClick={(e) => {
                    e.stopPropagation()
                }}
                onChange={onSpecialtyChange}
                className="themed-svg"
                data-icon="vaultboy"
                style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
            />
        </div>
    )
}

export default Skill
