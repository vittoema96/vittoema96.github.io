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