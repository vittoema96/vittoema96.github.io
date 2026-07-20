import React from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/app/contexts/CharacterContext.tsx'
import { isCharacterSpecial, SpecialType } from '@/features/character/special/special.ts';
import {
    CompanionSpecialType,
} from '@/features/character/special/special.companion.ts';
import { ORIGINS } from '@/features/character/origin.ts';
import { COMPANION_TYPES } from '@/utils/companionTypes.ts';
import { usePopup } from '@/app/contexts/PopupContext.tsx';


interface StatGearProps {
    statType: CompanionSpecialType | SpecialType
    isEditing?: boolean
    children?: React.ReactNode
}

/**
 * Reusable gear display component for Body/Mind stats
 * Works exactly like SpecialGear but for companion stats
 */
function StatGear({ statType, isEditing = false, children }: Readonly<StatGearProps>) {
    const { t } = useTranslation()
    const { showConfirm } = usePopup()

    const { character, updateCharacter, replenishLuck } = useCharacter()
    const companion = character.companion!

    let value
    let maxValue
    let minValue
    if(isCharacterSpecial(statType)){
        value = character.special[statType]
        maxValue = character.origin.specialMaxValues[statType]
        if(character.origin === ORIGINS.SUPER_MUTANT
                && ['strength', 'endurance'].includes(statType)){
            minValue = 6
        } else {
            minValue = 4
        }
    } else {
        value = companion.special[statType]
        maxValue = 10
        minValue = COMPANION_TYPES[companion.type].special[statType]
    }

    // Handle stat changes (click to increment in edit mode)
    const handleClick = () => {
        if (!isEditing) { return }

        const current = value
        const next = current < maxValue ? current + 1 : minValue // Cycle back to base if at max

        if(isCharacterSpecial(statType)) {
            updateCharacter({
                special: {
                    [statType]: next
                },
                currentLuck: statType === "luck" ? Math.min(character.currentLuck, next) : character.currentLuck
            })
        } else {
            updateCharacter({
                companion: {
                    ...companion,
                    special: {
                        ...companion.special,
                        [statType]: next
                    }
                }
            })
        }
    }

    // Handle current luck replenish
    const handleLuckReplenish = () => {
        if (!isEditing) {
            showConfirm(t('replenishLuckConfirm'), replenishLuck)
        }
    }

    const style = {
        cursor: isEditing ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        aspectRatio: 1
    } as const

    let valueText = `${value}`
    if (isEditing) {
        valueText += `/${maxValue}`
    }

    return (
        <div
            onClick={() => handleClick()}
            className="special"
            style={style}>
            <span className="special__name">{t(statType)}</span>
            <span style={{ fontSize: '24cqw' }}>{valueText}</span>
            {statType === "luck" && (
                <div
                    className="themed-svg sub-special"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleLuckReplenish()
                    }}
                    style={style}>
                    <span style={{fontSize: '24cqw'}}>
                        {character.currentLuck}
                    </span>
                </div>
            )}
            {children}
        </div>
    )
}

export default StatGear

