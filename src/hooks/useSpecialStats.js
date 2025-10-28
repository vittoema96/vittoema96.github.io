import { useCallback } from 'react'
import { SPECIAL } from '../js/constants.js'
import { useCharacter } from '../contexts/CharacterContext.jsx'
import { getSpecialMax } from '../utils/itemValidation.js'

/**
 * Custom hook for managing SPECIAL stats
 * Encapsulates logic for incrementing SPECIAL stats and managing current luck
 * @returns {Object} SPECIAL stat management functions
 */
export const useSpecialStats = () => {
    const { character, updateCharacter } = useCharacter()

    /**
     * Handle SPECIAL stat increment (cycles back to 4 when at max)
     * @param {string} specialName - SPECIAL stat name
     */
    const incrementSpecial = useCallback((specialName) => {
        const current = character.special[specialName]
        const max = getSpecialMax(specialName, character.origin)
        const next = current < max ? current + 1 : 4 // Cycle back to 4 if at max

        updateCharacter({
            special: {
                ...character.special,
                [specialName]: next
            }
        })

        // Update current luck if luck special changes
        if (specialName === SPECIAL.LUCK && character.currentLuck > next) {
            updateCharacter({ currentLuck: next })
        }
    }, [character, updateCharacter])

    /**
     * Replenish current luck to max (SPECIAL.LUCK value)
     */
    const replenishLuck = useCallback(() => {
        updateCharacter({ currentLuck: character.special[SPECIAL.LUCK] })
    }, [character.special, updateCharacter])

    /**
     * Spend luck point (decrease current luck by 1)
     */
    const spendLuck = useCallback(() => {
        if (character.currentLuck > 0) {
            updateCharacter({ currentLuck: character.currentLuck - 1 })
        }
    }, [character.currentLuck, updateCharacter])

    return {
        incrementSpecial,
        replenishLuck,
        spendLuck
    }
}

