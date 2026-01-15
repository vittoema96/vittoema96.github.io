import { useTranslation } from 'react-i18next'
import React from 'react'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import { useCharacter } from "@/contexts/CharacterContext.tsx"
import {SkillType} from "@/types";
import {SKILL_TO_SPECIAL_MAP} from "@/utils/characterSheet.ts";

interface SkillProps {
    skillId: SkillType,
    isEditing: boolean
}

function Skill({ skillId, isEditing}: Readonly<SkillProps>) {
    const { t } = useTranslation()
    const { showD20Popup } = usePopup()
    const { character, updateCharacter } = useCharacter()

    // Derived values - recalculated when character changes
    const specialName = SKILL_TO_SPECIAL_MAP[skillId]
    const hasSpecialty = character.specialties.includes(skillId)
    const specialtyBonus = hasSpecialty ? 2 : 0
    const skillMax = character.origin.skillMaxValue
    const skill = character.skills[skillId]

    // Handle skill changes
    const onSkillClick = () => {
        if (!isEditing) {
            showD20Popup(skillId)
            return
        }

        const next = skill < skillMax ? skill - specialtyBonus + 1 : 0 // Cycle back to 0 if at max

        updateCharacter({
            skills: {
                ...character.skills,
                [skillId]: next
            }
        })
    }

    // Handle specialty checkbox changes
    const onSpecialtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            <span>{character.skills[skillId]}</span>
            <input
                type="checkbox"
                disabled={!isEditing}
                checked={hasSpecialty}
                onClick={(e) => e.stopPropagation()}
                onChange={onSpecialtyChange}
                className="themed-svg"
                data-icon="vaultboy"
                style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
            />
        </div>
    )
}

export default Skill
