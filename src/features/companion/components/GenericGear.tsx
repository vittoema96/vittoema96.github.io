import React from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'

type StatType = 'body' | 'mind'

interface GenericGearProps {
    statType: StatType
    baseValue: number
    isEditing?: boolean
    children?: React.ReactNode
}

/**
 * Reusable gear display component for Body/Mind stats
 * Works exactly like SpecialGear but for companion stats
 */
function GenericGear({ statType, baseValue, isEditing = false, children }: Readonly<GenericGearProps>) {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const companion = character.companion!

    const value = companion.special[statType]
    const maxValue = 10

    // Handle stat changes (click to increment in edit mode)
    const handleClick = () => {
        if (!isEditing) { return }

        const current = companion.special[statType]
        const next = current < maxValue ? current + 1 : baseValue // Cycle back to base if at max

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
            onClick={handleClick}
            className="special"
            style={style}
        >
            <span className="special__name">{t(statType)}</span>
            <span style={{ fontSize: '24cqw' }}>{valueText}</span>
            {children}
        </div>
    )
}

export default GenericGear

