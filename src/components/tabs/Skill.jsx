import React from 'react'

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
    return (
        <div 
            className="skill" 
            data-skill={skillId}
            onClick={() => onSkillClick(skillId)}
            style={{ 
                cursor: isEditing ? 'pointer' : 'default',
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
