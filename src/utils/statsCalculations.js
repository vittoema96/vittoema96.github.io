import {SPECIAL, SKILLS, ORIGINS} from '../js/constants.js'
import { getModifiedItemData } from './itemUtils.js'
import { getBodyLocations, mapItemLocations } from './bodyLocations.js'

// TODO should not use defensive assignment, but throw errors
//      problem is: order of operations requires the defensive assignment (for now, refactoring needed)

/**
 * Calculate effective skill value (base + specialty bonus)
 * @param {Object} character - Character object
 * @param {string} skillId - Skill ID from SKILLS constant
 * @returns {number} Effective skill value (base + 2 if specialty)
 */
export const calculateEffectiveSkillValue = (character, skillId) => {
    if (!character || !skillId) return 0

    const baseValue = character.skills?.[skillId] || 0
    const hasSpecialty = character.specialties?.includes(skillId) || false
    return baseValue + (hasSpecialty ? 2 : 0)
}

/**
 * Calculate all effective skills for a character
 * @param {Object} character - Character object
 * @returns {Object} Map of skillId -> effective value
 */
export const calculateEffectiveSkills = (character) => {
    const effectiveSkills = {}
    Object.values(SKILLS).forEach(skillId => {
        effectiveSkills[skillId] = calculateEffectiveSkillValue(character, skillId)
    })
    return effectiveSkills
}

/**
 * Calculate maximum HP for a character
 * @param {Object} character - Character object
 * @returns {number} Maximum HP
 */
export const calculateMaxHp = (character) => {
    return character.special[SPECIAL.ENDURANCE] +
           character.special[SPECIAL.LUCK] +
           character.level - 1
}

/**
 * Calculate maximum carry weight for a character
 * @param {Object} character - Character object
 * @param {Object} dataManager - Data manager instance
 * @returns {number} Maximum carry weight in kg
 */
export const calculateMaxWeight = (character, dataManager) => {
    // If no ORIGIN is selected, use Survivor to calcMaxCarryWeight (any origin except mrHandy would be ok)
    let maxWeight = character.origin?.calcMaxCarryWeight(character) || ORIGINS.SURVIVOR.calcMaxCarryWeight(character)

    // Add carry weight bonuses from equipped items with mods
    character.items.forEach(item => {
        if (!item.equipped) return

        const [itemId] = item.id.split('_')
        const itemData = getModifiedItemData(dataManager, itemId, item.mods)
        if (itemData?.CARRY_WEIGHT_BONUS) {
            maxWeight += Number(itemData.CARRY_WEIGHT_BONUS) || 0
        }
    })

    return maxWeight
}

/**
 * Calculate current inventory weight
 * @param {Object} character - Character object
 * @param {Object} dataManager - Data manager instance
 * @returns {number} Current weight in kg
 */
export const calculateCurrentWeight = (character, dataManager) => {
    return character.items.reduce((total, item) => {
        const baseId = item.id.split('_')[0]
        const itemData = getModifiedItemData(dataManager, baseId, item.mods)
        const weight = Number(itemData?.WEIGHT) || 0
        return total + weight * (item.quantity || 1)
    }, 0)
}

/**
 * Calculate defense value based on Agility
 * @param {Object} character - Character object
 * @returns {number} Defense value (1 or 2)
 */
export const calculateDefense = (character) => {
    return character.special[SPECIAL.AGILITY] < 9 ? 1 : 2
}

/**
 * Calculate initiative value
 * @param {Object} character - Character object
 * @returns {number} Initiative value (AGI + PER)
 */
export const calculateInitiative = (character) => {
    return character.special[SPECIAL.AGILITY] + character.special[SPECIAL.PERCEPTION]
}

/**
 * Calculate melee damage bonus based on Strength
 * @param {Object} character - Character object
 * @returns {number} Melee damage bonus (0-3)
 */
export const calculateMeleeDamage = (character) => {
    const str = character.special[SPECIAL.STRENGTH]
    if (str < 7) return 0
    if (str < 9) return 1
    if (str < 11) return 2
    return 3
}

/**
 * Calculate damage reduction for all body locations
 * @param {Object} character - Character object
 * @param {Object} dataManager - Data manager instance
 * @returns {Object} Map of location -> {physical, energy, radiation}
 */
export const calculateLocationsDR = (character, dataManager) => {
    const damageTypes = ['physical', 'energy', 'radiation']
    const bodyParts = getBodyLocations(character.origin)
    const locationsDR = {}

    // Initialize all locations with 0 DR
    bodyParts.forEach(location => {
        locationsDR[location] = {}
        damageTypes.forEach(type => {
            locationsDR[location][type] = 0
        })
    })

    // Calculate DR from equipped items only (with mods applied)
    // Use MAX value between under and over layers for each damage type
    character.items.forEach(item => {
        // Only count equipped items
        if (!item.equipped) return

        // Skip robot parts if origin is not Mr. Handy
        if (item.type === 'robotParts' && character.origin !== 'mrHandy') return

        const [itemId, side] = item.id.split('_')
        const itemData = getModifiedItemData(dataManager, itemId, item.mods)
        if (!itemData?.LOCATIONS_COVERED) return

        // Get locations this item covers
        const locations = mapItemLocations(itemData.LOCATIONS_COVERED, side)

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
    if (character.origin?.hasRadiationImmunity) {
        bodyParts.forEach(location => {
            locationsDR[location].radiation = Infinity
        })
    }

    return locationsDR
}

/**
 * Calculate all derived stats for a character
 * @param {Object} character - Character object
 * @param {Object} dataManager - Data manager instance
 * @returns {Object} All derived stats
 */
export const calculateDerivedStats = (character, dataManager) => {
    if (!character || !dataManager?.getItem) {
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

    return {
        maxHp: calculateMaxHp(character),
        maxWeight: calculateMaxWeight(character, dataManager),
        currentWeight: calculateCurrentWeight(character, dataManager),
        defense: calculateDefense(character),
        initiative: calculateInitiative(character),
        meleeDamage: calculateMeleeDamage(character),
        locationsDR: calculateLocationsDR(character, dataManager),
        effectiveSkills: calculateEffectiveSkills(character)
    }
}

