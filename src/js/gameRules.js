import { SKILLS } from './constants.js';

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