import {SKILL_TO_SPECIAL_MAP} from "@/utils/characterSheet.ts";

/**
 * Weapon utility functions
 * Centralized logic for weapon-related calculations
 */

import {Character, SkillType, WeaponItem} from "@/types";

/**
 * Get ammo count for a weapon
 */
export const getWeaponAmmoCount = (weapon: WeaponItem, character: Character) => {
    const characterItem = character.items.find(item => item.id === weapon.ID)
    if (weapon.AMMO_TYPE === 'na') {return Infinity}
    if (weapon.AMMO_TYPE === 'self') {return characterItem?.quantity ?? 0}

    // Find ammo in character items
    return character.items?.find(item => item.id === weapon.AMMO_TYPE)?.quantity ?? 0
}

/**
 * Get ammo per shot for a weapon (10 for gatling, 1 for others)
 */
export const getWeaponAmmoPerShot = (weapon: WeaponItem) => {
    const isGatling = (weapon.QUALITIES || []).includes('qualityGatling')
    return isGatling ? 10 : 1
}

/**
 * Check if weapon has enough ammo to attack
 */
export const hasEnoughAmmo = (weapon: WeaponItem, character: Character) => {
    const currentAmmo = getWeaponAmmoCount(weapon, character)
    const ammoPerShot = getWeaponAmmoPerShot(weapon)

    return currentAmmo >= ammoPerShot
}

/**
 * Calculate weapon stats (skill value, special value, target number)
 */
export const calculateWeaponStats = (character: Character, weaponData: WeaponItem) => {
    const weaponCategory = weaponData.CATEGORY as SkillType
    const skillValue = character.skills[weaponCategory]
    const specialType = SKILL_TO_SPECIAL_MAP[weaponCategory]
    const specialValue = character.special[specialType]
    const targetNumber = skillValue + specialValue

    return { skillValue, specialValue, targetNumber }
}

