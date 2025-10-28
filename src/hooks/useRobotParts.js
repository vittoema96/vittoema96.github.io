import { useEffect } from 'react'
import { useCharacter } from '../contexts/CharacterContext.jsx'

/**
 * Robot part IDs that Mr. Handy characters must have
 */
const ROBOT_PART_IDS = [
    'robotPartOptics',
    'robotPartBody',
    'robotPartArms',
    'robotPartThrusters'
]

/**
 * Default mod for robot parts
 */
const DEFAULT_ROBOT_MOD = 'modRobotPlatingStandard'

/**
 * Custom hook to ensure Mr. Handy characters have all required robot parts
 * Automatically adds missing robot parts with default mods
 */
export const useRobotParts = () => {
    const { character, updateCharacter } = useCharacter()

    useEffect(() => {
        if (character.origin !== 'mrHandy') return

        let needsUpdate = false
        const updatedItems = [...character.items]

        ROBOT_PART_IDS.forEach(partId => {
            const existingPart = updatedItems.find(item => item.id === partId)

            if (!existingPart) {
                // Add robot part with default mod
                updatedItems.push({
                    id: partId,
                    type: 'robotParts',
                    quantity: 1,
                    equipped: true,
                    mods: [DEFAULT_ROBOT_MOD]
                })
                needsUpdate = true
            } else if (!existingPart.mods || existingPart.mods.length === 0) {
                // Ensure existing part has default mod
                existingPart.mods = [DEFAULT_ROBOT_MOD]
                needsUpdate = true
            }
        })

        if (needsUpdate) {
            updateCharacter({ items: updatedItems })
        }
    }, [character.origin, character.items, updateCharacter])
}

