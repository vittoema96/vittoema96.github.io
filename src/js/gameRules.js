import { SKILLS } from './constants.js';

// Check if a skill is a melee combat skill
export const isMelee = skill => [SKILLS.UNARMED, SKILLS.MELEE_WEAPONS].includes(skill);

// Determine which armor layers an item type covers
export const getItemCoveredLayers = itemType => {
    const result = [];
    const isBoth = ['outfit', 'headgear'].includes(itemType);

    if (itemType.endsWith('Armor') || isBoth) {
        result.push('over');
    }
    if (itemType === 'clothing' || isBoth) {
        result.push('under');
    }
    return result;
};

// Check if an item is a Mr Handy exclusive weapon
export const isMrHandyWeapon = (itemId) => {
    if (!itemId) return false;
    // Remove side suffix if present (_left, _right)
    const baseId = itemId.split('_')[0];
    return baseId.startsWith('weaponMrHandy');
};

// Check if an item is a weapon
export const isWeapon = (itemType) => {
    return Object.values(SKILLS).includes(itemType);
};

// Check if an item is apparel (armor or clothing)
export const isApparel = (itemType) => {
    return ['clothing', 'headgear', 'outfit'].includes(itemType) || itemType.endsWith('Armor');
};