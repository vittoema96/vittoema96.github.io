/**
 * Weapon utility functions
 * Centralized logic for weapon-related calculations
 */

import {Character, WeaponItem} from "@/types";

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
    if(weapon.AMMO_TYPE === 'na') {return 0}

    const isGatling = (weapon.QUALITIES || []).includes('qualityGatling')
    const isAmmoHungry = (weapon.QUALITIES || []).some(q => q.startsWith('qualityAmmoHungry'))

    if(isGatling){
        return  10
    } else if(isAmmoHungry){
        const quality = (weapon.QUALITIES || []).find(q => q.startsWith('qualityAmmoHungry'))
        const [_, qualityOpt] = quality?.split(':') ?? [];
        return Number(qualityOpt) || 1;
    }
    return 1
}

/**
 * Check if weapon has enough ammo to attack
 */
export const hasEnoughAmmo = (weapon: WeaponItem, character: Character) => {
    const currentAmmo = getWeaponAmmoCount(weapon, character)
    const ammoPerShot = getWeaponAmmoPerShot(weapon)

    return currentAmmo >= ammoPerShot
}

