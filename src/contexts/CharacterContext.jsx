import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { DEFAULT_CHARACTER, SPECIAL, SKILLS } from '../js/constants.js'
import { useDataManager } from '../hooks/useDataManager.js'

const CharacterContext = createContext()

export const useCharacter = () => {
    const context = useContext(CharacterContext)
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider')
    }
    return context
}

/**
 * Helper function to get effective skill value (base + specialty bonus)
 * @param {Object} character - Character object
 * @param {string} skillId - Skill ID from SKILLS constant
 * @returns {number} Effective skill value (base + 2 if specialty)
 */
export const getEffectiveSkillValue = (character, skillId) => {
    if (!character || !skillId) return 0 // TODO throw (ErrorBoundary managed) error instead 
    const baseValue = character.skills?.[skillId] || 0
    const hasSpecialty = character.specialties?.includes(skillId) || false
    return baseValue + (hasSpecialty ? 2 : 0)
}

export function CharacterProvider({ children }) {
    const STORAGE_KEY = 'character_default'

    const [character, setCharacterState] = useState(DEFAULT_CHARACTER)
    const [isLoading, setIsLoading] = useState(true)
    const dataManager = useDataManager()

    // Load character on startup
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsedCharacter = JSON.parse(saved)
                // Merge with defaults to handle new properties in updates
                const mergedCharacter = { ...DEFAULT_CHARACTER, ...parsedCharacter }
                setCharacterState(mergedCharacter)
            }
        } catch (error) {
            console.error('Failed to load character:', error)
            // Keep default character on error
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Auto-save on every change
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(character))
            } catch (error) {
                console.error('Failed to save character:', error)
            }
        }
    }, [character, isLoading])

    // Derived stats - calculated from character data
    const derivedStats = useMemo(() => {
        if (!character || !dataManager.getItem) {
            return {
                maxHp: 0,
                maxWeight: 0,
                currentWeight: 0,
                defense: 0,
                initiative: 0,
                meleeDamage: 0,
                locationsDR: {},
                effectiveSkills: {}
            }
        }

        // Calculate effective skill values (base + specialty bonus)
        const effectiveSkills = {}
        Object.values(SKILLS).forEach(skillId => {
            effectiveSkills[skillId] = getEffectiveSkillValue(character, skillId)
        })

        // Calculate max HP
        const maxHp = character.special[SPECIAL.ENDURANCE] +
                     character.special[SPECIAL.LUCK] +
                     character.level - 1

        // Calculate max weight (Mr Handy has fixed 75kg carry weight)
        const maxWeight = 75 + (character.origin === 'mrHandy'
            ? 0
            : character.special[SPECIAL.STRENGTH] * 5)

        // Calculate current weight from inventory
        const currentWeight = character.items.reduce((total, item) => {
            const itemData = dataManager.getItem(item.id)
            const weight = Number(itemData?.WEIGHT) || 0
            return total + weight * (item.quantity || 1)
        }, 0)

        // Calculate defense
        const defense = character.special[SPECIAL.AGILITY] < 9 ? 1 : 2

        // Calculate initiative
        const initiative = character.special[SPECIAL.AGILITY] + character.special[SPECIAL.PERCEPTION]

        // Calculate melee damage
        const str = character.special[SPECIAL.STRENGTH]
        const meleeDamage = str < 7 ? 0 : str < 9 ? 1 : str < 11 ? 2 : 3

        // Calculate damage reduction for all body locations
        const damageTypes = ['physical', 'energy', 'radiation']
        const bodyParts = ['head', 'leftArm', 'rightArm', 'torso', 'leftLeg', 'rightLeg']
        const locationsDR = {}

        // Initialize all locations with 0 DR
        bodyParts.forEach(location => {
            locationsDR[location] = {}
            damageTypes.forEach(type => {
                locationsDR[location][type] = 0
            })
        })

        // Calculate DR from equipped items only
        // Use MAX value between under and over layers for each damage type
        character.items.forEach(item => {
            // Only count equipped items
            if (!item.equipped) {
                return
            }

            const [itemId, side] = item.id.split('_')
            const itemData = dataManager.getItem(itemId)
            if (!itemData || !itemData.LOCATIONS_COVERED) {
                return
            }

            // Get locations this item covers
            const locations = []
            // TODO current handling of the below for loop can be optimized
            for (const location of itemData.LOCATIONS_COVERED) {
                if (location === 'arm') {
                    // Handle side-specific arms (singular - for individual armor pieces)
                    if (side === 'left') {
                        locations.push('leftArm')
                    } else if (side === 'right') {
                        locations.push('rightArm')
                    } else {
                        locations.push('leftArm', 'rightArm')
                    }
                } else if (location === 'arms') {
                    // Handle both arms (plural - for clothing/outfits)
                    locations.push('leftArm', 'rightArm')
                } else if (location === 'leg') {
                    // Handle side-specific legs (singular - for individual armor pieces)
                    if (side === 'left') {
                        locations.push('leftLeg')
                    } else if (side === 'right') {
                        locations.push('rightLeg')
                    } else {
                        locations.push('leftLeg', 'rightLeg')
                    }
                } else if (location === 'legs') {
                    // Handle both legs (plural - for clothing/outfits)
                    locations.push('leftLeg', 'rightLeg')
                } else if (location === 'torso') {
                    locations.push('torso')
                } else if (location === 'head') {
                    locations.push('head')
                } else {
                    locations.push(location)
                }
            }

            // Use MAX between current DR and item DR for each damage type
            locations.forEach(location => {
                if (locationsDR[location]) {
                    const itemPhysical = Number(itemData.PHYSICAL_RES) || 0
                    const itemEnergy = Number(itemData.ENERGY_RES) || 0
                    const itemRadiation = Number(itemData.RADIATION_RES) || 0

                    locationsDR[location].physical = Math.max(locationsDR[location].physical, itemPhysical)
                    locationsDR[location].energy = Math.max(locationsDR[location].energy, itemEnergy)
                    locationsDR[location].radiation = Math.max(locationsDR[location].radiation, itemRadiation)
                }
            })
        })

        // Mr Handy and Ghoul have infinite radiation resistance
        if (character.origin === 'mrHandy' || character.origin === 'ghoul') {
            bodyParts.forEach(location => {
                locationsDR[location].radiation = Infinity
            })
        }

        return {
            maxHp,
            maxWeight,
            currentWeight,
            defense,
            initiative,
            meleeDamage,
            locationsDR,
            effectiveSkills
        }
    }, [character, dataManager])

    // Update character (replaces your characterData.property = value)
    const updateCharacter = useCallback((updates) => {
        setCharacterState(prev => {
            const newCharacter = { ...prev, ...updates }

            // If SPECIAL stats or level changed, adjust HP accordingly
            const specialChanged = updates.special && Object.keys(updates.special).length > 0
            const levelChanged = updates.level !== undefined

            if (specialChanged || levelChanged) {
                // Calculate new maxHp
                const newMaxHp = newCharacter.special[SPECIAL.ENDURANCE] +
                               newCharacter.special[SPECIAL.LUCK] +
                               newCharacter.level - 1

                // Calculate old maxHp
                const oldMaxHp = prev.special[SPECIAL.ENDURANCE] +
                               prev.special[SPECIAL.LUCK] +
                               prev.level - 1

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

            return newCharacter
        })
    }, [])

    // Reset to default character
    const resetCharacter = useCallback(() => {
        setCharacterState({ ...DEFAULT_CHARACTER })
    }, [])

    // Download character as JSON
    const downloadCharacter = useCallback(() => {
        const dataStr = JSON.stringify(character, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `character_${character.name || 'unnamed'}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }, [character])

    // Upload character from JSON
    const uploadCharacter = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const uploadedCharacter = JSON.parse(e.target.result)

                    // Basic validation
                    if (!uploadedCharacter || typeof uploadedCharacter !== 'object') {
                        throw new Error('Invalid character file format')
                    }

                    // Merge with defaults to ensure all properties exist
                    const validatedCharacter = { ...DEFAULT_CHARACTER, ...uploadedCharacter }
                    setCharacterState(validatedCharacter)
                    resolve(validatedCharacter)
                } catch (error) {
                    reject(new Error(`Failed to parse character file: ${error.message}`))
                }
            }

            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        })
    }, [])

    const contextValue = {
        character,
        derivedStats,
        updateCharacter,
        resetCharacter,
        downloadCharacter,
        uploadCharacter,
        isLoading
    }

    return (
        <CharacterContext.Provider value={contextValue}>
            {children}
        </CharacterContext.Provider>
    )
}
