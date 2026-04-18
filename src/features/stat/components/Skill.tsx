import { useTranslation } from 'react-i18next'
import React from 'react'
import { usePopup } from '@/contexts/popup/PopupContext'
import { useCharacter } from "@/contexts/CharacterContext"
import { getSpecialFromSkill, SkillType } from '@/services/character/utils.ts';
import { FitText } from '@/components/FitText.tsx';

interface SkillProps {
    skillId: SkillType;
    isEditing: boolean;
}

function Skill({ skillId, isEditing}: Readonly<SkillProps>) {
    const { t } = useTranslation()
    const { showD20Popup } = usePopup()
    const { character, updateCharacter } = useCharacter()

    // Derived values - recalculated when character changes
    const specialName = getSpecialFromSkill(skillId)
    const hasSpecialty = character.specialties.includes(skillId)
    const specialtyBonus = hasSpecialty ? 2 : 0
    const skillMax = character.traits.includes('traitGoodNatured')
                             && !hasSpecialty && [
                                 'speech', 'medicine', 'repair' , 'science', 'barter'
                             ].includes(skillId) ?
            character.origin.skillMaxValue - 2 : character.origin.skillMaxValue
    const skill = character.skills[skillId]

    // Handle skill changes
    const onSkillClick = () => {
        if (!isEditing) {
            showD20Popup({ skillId: skillId });
            return
        }

        const next = skill < skillMax ? skill - specialtyBonus + 1 : 0 // Cycle back to 0 if at max

        updateCharacter({
            skills: {
                [skillId]: next
            }
        })
    }

    // Handle specialty checkbox changes
    const onSpecialtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked
        if (!isEditing) {
            showD20Popup({ skillId: skillId })
            return
        }

        const currentSpecialties = character.specialties || []
        const newSpecialties = checked
            ? [...currentSpecialties, skillId]
            : currentSpecialties.filter(s => s !== skillId)

        updateCharacter({ specialties: newSpecialties })
    }
    let valueText;
    if(isEditing){
        let baseValue = `${character.skills[skillId] - specialtyBonus}`
        if(specialtyBonus){
            baseValue += `+${specialtyBonus}`;
        }
        valueText = baseValue + `/${skillMax}`
    } else {
        valueText = character.skills[skillId]
    }

    return (
        <button
            className="row skill"
            onClick={onSkillClick}
        >
            <div className="stack" style={{
                flex: "1 1 70%", // grow, shrink, basis
                gap: "2px",
                minWidth: 0
            }}>
                <FitText minSize={1} maxSize={15} wrap={isEditing}>
                    {t(skillId)}
                </FitText>
                <span style={{fontSize: "var(--space-m)"}}>
                    <i>[{t(specialName)}]</i>
                </span>
            </div>

            <span style={{
                fontSize: isEditing ? "0.7rem" : "1rem",
                flex: "0 0 auto",
            }}>
                {valueText}
            </span>
            <input
                type="checkbox"
                disabled={!isEditing}
                checked={hasSpecialty}
                onClick={(e) => e.stopPropagation()}
                onChange={onSpecialtyChange}
                className="themed-svg"
                data-icon="vaultboy"
                style={{
                    pointerEvents: isEditing ? 'auto' : 'none',
                    backgroundColor: hasSpecialty ? "var(--primary-color)" : "var(--secondary-color)",
                    flex: "0 0 1.5rem",
                }}
            />

        </button>
    )
}

export default Skill
