/**
 * Weapon utility functions
 * Centralized logic for weapon-related calculations
 */

/**
 * Get ammo count for a weapon
 * @param {Object} weaponData - Weapon data object
 * @param {Object} characterItem - Character's weapon item
 * @param {Array} characterItems - All character items
 * @returns {number|string} Ammo count or '-' for N/A
 */
export const getWeaponAmmoCount = (weaponData, characterItem, characterItems) => {
    if (weaponData.AMMO_TYPE === 'na') return '-'
    if (weaponData.AMMO_TYPE === 'self') return characterItem.quantity

    // Find ammo in character items
    const ammoItem = characterItems?.find(item => item.id === weaponData.AMMO_TYPE)
    return ammoItem ? ammoItem.quantity : 0
}

/**
 * Get ammo per shot for a weapon (10 for gatling, 1 for others)
 * @param {Object} weaponData - Weapon data object
 * @returns {number} Ammo consumed per shot
 */
export const getWeaponAmmoPerShot = (weaponData) => {
    const isGatling = (weaponData.QUALITIES || []).includes('qualityGatling')
    return isGatling ? 10 : 1
}

/**
 * Check if weapon has enough ammo to attack
 * @param {Object} weaponData - Weapon data object
 * @param {Object} characterItem - Character's weapon item
 * @param {Array} characterItems - All character items
 * @returns {boolean} True if weapon has enough ammo
 */
export const hasEnoughAmmo = (weaponData, characterItem, characterItems) => {
    if (weaponData.AMMO_TYPE === 'na') return true // Melee weapons don't need ammo

    const ammoPerShot = getWeaponAmmoPerShot(weaponData)
    const currentAmmo = getWeaponAmmoCount(weaponData, characterItem, characterItems)
    
    if (typeof currentAmmo === 'string') return false // '-' case

    return currentAmmo >= ammoPerShot
}

/**
 * Calculate weapon stats (skill value, special value, target number)
 * @param {Object} character - Character object
 * @param {Object} weaponData - Weapon data object
 * @param {Function} calculateEffectiveSkillValue - Function to calculate effective skill value
 * @param {Object} SKILL_TO_SPECIAL_MAP - Mapping of skills to SPECIAL stats
 * @returns {Object} { skillValue, specialValue, targetNumber }
 */
export const calculateWeaponStats = (character, weaponData, calculateEffectiveSkillValue, SKILL_TO_SPECIAL_MAP) => {
    const skillValue = calculateEffectiveSkillValue(character, weaponData.TYPE)
    const specialValue = character.special[SKILL_TO_SPECIAL_MAP[weaponData.TYPE]] || 5
    const targetNumber = skillValue + specialValue

    return { skillValue, specialValue, targetNumber }
}

