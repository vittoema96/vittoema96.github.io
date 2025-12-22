import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {DEFAULT_CHARACTER, getOriginById, ORIGINS} from '../js/constants.js'
import {useDataManager} from '../hooks/useDataManager.js'
import {calculateDerivedStats, calculateEffectiveSkillValue, calculateMaxHp} from '../utils/statsCalculations.js'

const CharacterContext = createContext()

// Constants
const STORAGE_KEY = 'character_default'

// Robot part IDs that Mr. Handy characters must have
const ROBOT_PART_IDS = [
    'robotPartOptics',
    'robotPartBody',
    'robotPartArms',
    'robotPartThrusters'
]

// Default plating mod for robot parts (slot 0)
const DEFAULT_PLATING_MOD = 'modRobotPlatingStandard'


/**
 * Custom hook for accessing character context
 * @returns {*}
 */
export const useCharacter = () => {
    const context = useContext(CharacterContext)
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider')
    }
    return context
}

/**
 * Save character to localStorage
 * @param {Object} character - Character object
 */
function saveCharacter(character) {
    const serializedCharacter = serializeCharacter(character)
    const jsonCharacter = JSON.stringify(serializedCharacter)
    localStorage.setItem(STORAGE_KEY, jsonCharacter)
}

/**
 * Load character from localStorage
 * @returns {{readonly name: *, readonly origin: *, readonly background: *, readonly level: number, readonly caps: number, readonly special: {}, readonly currentLuck: number, readonly currentHp: number, readonly skills: {}, readonly specialties: [], readonly items: []}|(*&{readonly name: *, origin: T, readonly background: *, readonly level: number, readonly caps: number, readonly special: {}, readonly currentLuck: number, readonly currentHp: number, readonly skills: {}, readonly specialties: [], readonly items: []})}
 */
function loadCharacter() {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(saved)
    return deserializeCharacter(parsed || DEFAULT_CHARACTER)
}

/**
 * Serialize character
 * Serialization steps:
 * - Origin: originObj -> originId
 * @param {Object} character - Character object
 */
function serializeCharacter(character) {
    const serializedOrigin = character.origin?.id ?? character.origin ?? undefined
    return { ...character, origin: serializedOrigin }
}

/**
 * Deserialize character
 * Deserialization steps:
 * - Origin: originId -> originObj
 * @returns {Object} Character object
 */
function deserializeCharacter(character) {
    const merged = { ...structuredClone(DEFAULT_CHARACTER), ...character }
    const deserializedOrigin = typeof merged.origin === 'object' ? merged.origin : getOriginById(merged.origin) ?? undefined;
    return { ...character, origin: deserializedOrigin }
}

export function CharacterProvider({ children }) {

    // Lazy load character
    const [character, setCharacter] = useState(() => loadCharacter())
    // Load all csv data
    const dataManager = useDataManager()

    // Auto-save on every change
    useEffect(() => {
        saveCharacter(character);
    }, [character])

    /**
     * Function used to update character state.
     * Also checks for:
     * - SPECIAL stat changes: adjust HP accordingly
     * - LEVEL changes: adjust HP accordingly
     * - ORIGIN changes: add/remove robot parts
     */
    const updateCharacter = useCallback((updates) => {
        setCharacter(prev => {
            const newCharacter = deserializeCharacter({ ...prev, ...updates })

            // If SPECIAL stats or level changed, adjust HP accordingly
            const specialChanged = updates.special && Object.keys(updates.special).length > 0
            const levelChanged = updates.level !== undefined

            if (specialChanged || levelChanged) {
                const newMaxHp = calculateMaxHp(newCharacter)
                const oldMaxHp = calculateMaxHp(prev)
                const maxHpDelta = newMaxHp - oldMaxHp
                newCharacter.currentHp += maxHpDelta
                newCharacter.currentHp = Math.max(0, Math.min(newCharacter.currentHp, newMaxHp))

                // If maxHp increased, increase currentHp by the same amount
                if (newMaxHp > oldMaxHp) {
                    const hpIncrease = newMaxHp - oldMaxHp
                    newCharacter.currentHp = Math.min(prev.currentHp + hpIncrease, newMaxHp)
                }
                // If maxHp decreased and currentHp exceeds new maxHp, cap it
                else if (newCharacter.currentHp > newMaxHp) {
                    newCharacter.currentHp = newMaxHp
                }
            }

            // Add or remove robot parts based on origin
            const isMrHandy = newCharacter.origin === ORIGINS.MR_HANDY
            const hasRobotParts = newCharacter.items.some(i => ROBOT_PART_IDS.includes(i.id))
            if (isMrHandy && !hasRobotParts) {
                const newParts = ROBOT_PART_IDS.map(id => ({
                    id,
                    type: 'robotParts',
                    quantity: 1,
                    equipped: true,
                    mods: [DEFAULT_PLATING_MOD]
                }))
                newCharacter.items = [...newCharacter.items, ...newParts]
            } else if (!isMrHandy && hasRobotParts) {
                newCharacter.items = newCharacter.items.filter(i => !ROBOT_PART_IDS.includes(i.id))
            }

            return newCharacter
        })
    }, [])


    // Derived stats - calculated from character data using utility functions
    const derivedStats = useMemo(() => {
        return calculateDerivedStats(character, dataManager)
    }, [character, dataManager])


    // Reset to default character
    const resetCharacter = useCallback(() => {
        setCharacter({ ...DEFAULT_CHARACTER })
    }, [])


    /**
     * Utility method to download character as JSON
     */
    const downloadCharacter = useCallback(() => {
        const dataStr = JSON.stringify(serializeCharacter(character), null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `character_${character.name || 'unnamed'}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }, [character])


    /**
     * Utility method to upload character from JSON.
     * @param {File} file - JSON File object containing the character definition
     */
    const uploadCharacter = useCallback(async (file) => {
        try {
            const text = await file.text()
            const rawData = JSON.parse(text)
            const uploadedCharacter = deserializeCharacter(rawData)
            setCharacter(uploadedCharacter)
        } catch (error) {
            throw new Error(`Failed to parse character file: ${error.message}`)
        }
    }, [])

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            character,
            derivedStats,
            updateCharacter,
            resetCharacter,
            downloadCharacter,
            uploadCharacter
        }),
        [character, derivedStats, updateCharacter, resetCharacter, downloadCharacter, uploadCharacter]
    )

    return (
        <CharacterContext.Provider value={contextValue}>
            {children}
        </CharacterContext.Provider>
    )
}

CharacterProvider.propTypes = {
    children: PropTypes.listOf(PropTypes.node)
}

// Re-export for backward compatibility
export { calculateEffectiveSkillValue }
