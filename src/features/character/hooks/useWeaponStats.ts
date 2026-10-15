import {
    getModifiedItemData,
    getSkillForWeaponCategory,
    getSpecialForWeaponCategory,
    getWeaponAmmoCount,
    getWeaponAmmoPerShot,
    hasEnoughAmmo,
} from '@/features/character/items.ts';
import { CharacterItem } from '@/types';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useMemo } from 'react';
import { isCloseCombat, isType } from '@/features/item/utils.ts';
import {
    getDamageRatingBonus,
    getFireRateBonus,
    getRollSpecial,
} from '@/features/character/feats/rules';

export function useWeaponStats(characterItem: CharacterItem, isSneakAttack?: boolean) {
    const { character } = useCharacter();

    return useMemo(() => {
        const itemData = getModifiedItemData(characterItem, character.perks);

        if (!isType(itemData, 'weapon')) {
            return null;
        }

        const weaponSkill = getSkillForWeaponCategory(itemData.CATEGORY);
        const effectiveSpecial = getRollSpecial(character, {
            usingItem: itemData,
            skillId: weaponSkill,
        });
        const skillValue = character.skills[weaponSkill];
        const specialValue = effectiveSpecial[getSpecialForWeaponCategory(itemData.CATEGORY)];
        const targetNumber = specialValue + skillValue;

        const critThreshold = character.specialties.includes(weaponSkill)
            ? Math.max(skillValue, 1)
            : 1;

        // Damage
        const meleeDamageBonus = isCloseCombat(itemData.CATEGORY) ? character.meleeDamage : 0;
        const damageBonus =
            getDamageRatingBonus(character, characterItem, itemData, isSneakAttack) +
            meleeDamageBonus;

        // Fire Rate
        const fireRateBonus = getFireRateBonus(character, itemData);

        // Ammo
        const ammoPerShot = getWeaponAmmoPerShot(itemData);
        const ammoCount = getWeaponAmmoCount(itemData, character, characterItem);
        const hasAmmo = hasEnoughAmmo(itemData, character, characterItem);

        return {
            itemData,
            targetNumber,
            critThreshold,
            damageBonus,
            fireRateBonus,
            ammoCount,
            hasAmmo,
            ammoPerShot,
            legendaryMods: characterItem.mods.filter(m => m.startsWith('legendary')),
        };
    }, [character, characterItem, isSneakAttack]);
}
