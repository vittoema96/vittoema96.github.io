import React from 'react'
import {SpecialType} from "@/types";
import { useTranslation } from 'react-i18next'
import {usePopup} from "@/contexts/popup/PopupContext";
import {useCharacter} from "@/contexts/CharacterContext";


interface SpecialStatProps {
    specialType: SpecialType;
    editable?: boolean;
    children?: React.ReactNode;
}

/**
 * Reusable SPECIAL stat display component
 */
function SpecialStat({ specialType, editable = false, children }: Readonly<SpecialStatProps>) {
    const { t } = useTranslation()
    const { updateCharacter, replenishLuck } = useCharacter()
    const { showConfirm } = usePopup()
    const { character } = useCharacter()

    // Handle SPECIAL stat changes (click to increment in edit mode)
    const handleSpecialClick = (specialType: SpecialType) => {
        if (!editable) {return}
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
        if (!editable) {
            showConfirm(t('replenishLuckConfirm'), replenishLuck)
        }
    }

    const style = {
        cursor: editable ? 'pointer' : 'default'
    }

    return (
        <div
            className="special"
            onClick={() => handleSpecialClick(specialType)}
            style={style}>
            <span className="special__name">{t(specialType)}</span>
            <span className="special__value">{character.special[specialType]}</span>
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

