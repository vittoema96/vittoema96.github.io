import React from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { usePopup } from '../../contexts/PopupContext.jsx'

function Skill({
    skillId,
    skillValue,
    specialName,
    hasSpecialty,
    isEditing,
    onSkillClick,
    onSpecialtyChange,
    getSkillDisplayName,
    getSpecialDisplayName
}) {
    const t = useI18n()
    const { showD20Popup } = usePopup()
    return (
        <div
            className="skill"
            data-skill={skillId}
            onClick={() => {
                if (isEditing) {
                    onSkillClick(skillId)
                } else {
                    // In non-editing mode, open React D20 popup for skill checks
                    showD20Popup(skillId)
                }
            }}
            style={{
                cursor: 'pointer', // Always show pointer since both modes are clickable
                userSelect: 'none' // Prevent text selection on click
            }}
        >
            <span>
                <b data-i18n={skillId}>{getSkillDisplayName(skillId)}</b>
            </span>
            <span>
                <i>[<span data-i18n={specialName}>{getSpecialDisplayName(specialName)}</span>]</i>
            </span>
            <span id={`skill-${skillId}`}>{skillValue}</span>
            <input 
                id={`specialty-${skillId}`}
                type="checkbox"
                disabled={!isEditing}
                checked={hasSpecialty}
                onChange={(e) => {
                    e.stopPropagation()
                    onSpecialtyChange(skillId, e.target.checked)
                }}
                className="themed-svg" 
                data-icon="vaultboy"
                style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
            />
        </div>
    )
}

export default Skill
