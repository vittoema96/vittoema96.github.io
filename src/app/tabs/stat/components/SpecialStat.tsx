import React from 'react'
import {SpecialType} from "@/types";
import { useTranslation } from 'react-i18next'
import {usePopup} from "@/contexts/popup/PopupContext";
import {useCharacter} from "@/contexts/CharacterContext";


interface SpecialStatProps {
    specialType: SpecialType;
    isEditing?: boolean;
    children?: React.ReactNode;
}

/**
 * Reusable SPECIAL stat display component
 */
function SpecialStat({ specialType, isEditing = false, children }: Readonly<SpecialStatProps>) {
    const { t } = useTranslation()
    const { updateCharacter, replenishLuck } = useCharacter()
    const { showConfirm } = usePopup()
    const { character } = useCharacter()

    // Handle SPECIAL stat changes (click to increment in edit mode)
    const handleSpecialClick = (specialType: SpecialType) => {
        if (!isEditing) {return}
        const current = character.special[specialType]
        const max = character.origin.specialMaxValues[specialType]
        const next = current < max ? current + 1 : 4 // Cycle back to 4 if at max

        updateCharacter({
            special: {
                [specialType]: next
            },
            currentLuck: specialType === "luck" ? Math.min(character.currentLuck, next) : character.currentLuck
        })
    }

    // Handle current luck replenish
    const handleLuckReplenish = () => {
        if (!isEditing) {
            showConfirm(t('replenishLuckConfirm'), replenishLuck)
        }
    }

    const style = {
        cursor: isEditing ? 'pointer' : 'default'
    }
    let valueText = character.special[specialType];
    if(isEditing){
        valueText += `/${character.origin.specialMaxValues[specialType]}`
    }
    return (
        <div
            className="special"
            onClick={() => handleSpecialClick(specialType)}
            style={style}>
            <span className="special__name">{t(specialType)}</span>
            <span className="special__value">{valueText}</span>
            {specialType === "luck" && (
                <div
                    className="themed-svg sub-special"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleLuckReplenish()
                    }}
                    style={style}>
                    <span className="special__value">
                        {character.currentLuck}
                    </span>
                </div>
            )}
            {children}
        </div>
    )
}

export default SpecialStat

