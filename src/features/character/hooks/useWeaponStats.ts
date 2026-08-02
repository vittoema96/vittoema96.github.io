import { Character, CharacterItem } from '@/types';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useMemo } from 'react';
import {
    getModifiedItemData,
    getSkillForWeaponCategory,
    getSpecialForWeaponCategory,
    isCloseCombat,
    isType
} from '@/features/item/utils.ts';
import { getDamageRatingBonus, getFireRateBonus } from '@/features/character/feats';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';

/**
 * Get ammo count for a weapon
 */
export const getWeaponAmmoCount = (weapon: WeaponItem, character: Character) => {
    let ammoId = weapon.AMMO_TYPE
    // No ammo type = Infinite ammo (melee weapons can "fire" forever)
    if(ammoId === 'na') { return Infinity }
    if(ammoId === 'self') { ammoId = weapon.ID }

    return character.items.find(item => item.id === ammoId)?.quantity ?? 0
}
/**
 * Get ammo per shot for a weapon (10 for gatling, 1 for others)
 */
export const getWeaponAmmoPerShot = (weapon: WeaponItem) => {
    // TODO are we using all 3 values?
    if(['na', undefined, '-'].includes(weapon.AMMO_TYPE)) {return 0}

    const isGatling = weapon.QUALITIES.includes('qualityGatling')
    const ammoHungryQuality = weapon.QUALITIES.find(q => q.startsWith('qualityAmmoHungry'))

    if(isGatling){
        return  10
    } else if(ammoHungryQuality){
        const [_, qualityOpt] = ammoHungryQuality.split(':');
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

// TODO might want to provide dataItem and not CharacterItem
export function useWeaponStats(characterItem: CharacterItem) {
    const { character } = useCharacter();

    return useMemo(() => {
        const itemData = getModifiedItemData(characterItem, character.perks);

        if (!isType(itemData, 'weapon')) {
            return null;
        }

        const weaponSkill = getSkillForWeaponCategory(itemData.CATEGORY);
        const skillValue = character.skills[weaponSkill];
        const specialValue = character.special[getSpecialForWeaponCategory(itemData.CATEGORY)];
        const targetNumber = specialValue + skillValue;

        const critThreshold = character.specialties.includes(weaponSkill)
            ? Math.max(skillValue, 1)
            : 1;

        // Damage
        const meleeDamageBonus = isCloseCombat(itemData.CATEGORY) ? character.meleeDamage : 0;
        const damageBonus = getDamageRatingBonus(character, itemData) + meleeDamageBonus;

        // Fire Rate
        const fireRateBonus = getFireRateBonus(character, itemData);

        // Ammo
        const ammoPerShot = getWeaponAmmoPerShot(itemData)
        const ammoCount = getWeaponAmmoCount(itemData, character);
        const hasAmmo = hasEnoughAmmo(itemData, character);

        return {
            itemData,
            targetNumber,
            critThreshold,
            damageBonus,
            fireRateBonus,
            ammoCount,
            hasAmmo,
            ammoPerShot,
            legendaryMods: characterItem.mods.filter(m => m.startsWith('legendary'))
        };
    }, [character, characterItem]);
}
