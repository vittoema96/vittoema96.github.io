import type { CharacterItem, Item } from '@/types';
import { applyEffect, getModdedItemData, isType } from '@/features/item/utils.ts';
import type { PerkId } from '../feats/perks.ts';
import type { FeatSelection } from '../feats/types.ts';
import { getAllowedApparelCategories, getWeaponItemEffects } from '../feats/rules.ts';
import { getSpecialFromSkill, type SkillType } from '../skills/skills.ts';
import type { SpecialType } from '../special/special.ts';
import type { WeaponCategory } from '@/types/item.ts';

/**
 * Maps a weapon category to its corresponding skill.
 * Bows use Athletics rather than a skill with the same category name.
 */
export function getSkillForWeaponCategory(category: WeaponCategory): SkillType {
    return category === 'bows' ? 'athletics' : category;
}

/**
 * Maps a weapon category to the SPECIAL attribute used by its skill.
 * Bows use Agility because Athletics uses Agility for this weapon rule.
 */
export function getSpecialForWeaponCategory(category: WeaponCategory): SpecialType {
    return category === 'bows'
        ? 'agility'
        : getSpecialFromSkill(getSkillForWeaponCategory(category));
}

export function getModifiedItemData(item: CharacterItem | null | undefined, perks: PerkId[] = []) {
    const data = getModdedItemData(item);
    if (!isType(data, 'weapon')) {
        return data;
    }
    return getWeaponItemEffects(data, perks).reduce(
        (modified, effect) => applyEffect(modified, effect),
        data,
    );
}

/**
 * Returns whether the selected origin and feats allow a character to equip an
 * apparel item. Robot compatibility is handled here so UI actions and save
 * reconciliation use the same rule.
 */
export function canEquipApparel(
    itemData: Item | null | undefined,
    selection: FeatSelection,
): boolean {
    if (!isType(itemData, 'apparel')) {
        return true;
    }

    if (itemData.CATEGORY === 'robotPart') {
        return selection.origin?.isRobot === true;
    }

    const allowedCategories = getAllowedApparelCategories(
        selection.perks,
        selection.traits,
        selection.origin,
    );
    if (selection.origin?.needsSpecializedArmor && allowedCategories === undefined) {
        return false;
    }
    return allowedCategories === undefined || allowedCategories.has(itemData.CATEGORY);
}
