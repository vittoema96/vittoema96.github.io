import { SPECIAL, SKILLS } from './constants.js';

export const getMaxHp = characterData =>
    characterData.special[SPECIAL.ENDURANCE] +
    characterData.special[SPECIAL.LUCK] +
    characterData.level -
    1;

export const getMeleeDamage = characterData => {
    const str = characterData.special[SPECIAL.STRENGTH];
    return str < 7 ? 0 : str < 9 ? 1 : str < 11 ? 2 : 3;
};

export const getMaxWeight = characterData => 75 + characterData.special[SPECIAL.STRENGTH] * 5;

export function getCurrentWeight(characterData, dataManager) {
    return characterData.items.reduce((total, item) => {
        const itemData = dataManager.getItem(item.id);
        const weight = Number(itemData?.WEIGHT) || 0;
        return total + weight * (item.quantity || 1);
    }, 0);
}

// Calculate character's defense value based on agility
export const getDefense = characterData => (characterData.special[SPECIAL.AGILITY] < 9 ? 1 : 2);

// Calculate character's initiative based on agility and perception
export const getInitiative = characterData =>
    characterData.special[SPECIAL.AGILITY] + characterData.special[SPECIAL.PERCEPTION];

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

// Calculate damage reduction for all body locations
export const getLocationsDR = (characterData, dataManager) => {
    const damageTypes = ['physical', 'energy', 'radiation'];
    const bodyParts = ['head', 'leftArm', 'rightArm', 'torso', 'leftLeg', 'rightLeg'];

    const result = {};

    // Initialize all locations with 0 DR
    bodyParts.forEach(location => {
        result[location] = {};
        damageTypes.forEach(type => {
            result[location][type] = 0;
        });
    });

    // Calculate DR from equipped items
    characterData.items.forEach(item => {
        const itemData = dataManager.getItem(item.id);
        if (!itemData || !itemData.LOCATIONS_COVERED) {
            return;
        }

        // Get locations this item covers
        const locations = [];
        for (const location of itemData.LOCATIONS_COVERED) {
            if (location === 'arms') {
                locations.push('leftArm', 'rightArm');
            } else if (location === 'legs') {
                locations.push('leftLeg', 'rightLeg');
            } else {
                locations.push(location);
            }
        }

        // Add DR for each location and damage type
        locations.forEach(location => {
            if (result[location]) {
                result[location].physical += Number(itemData.PHYSICAL_RES) || 0;
                result[location].energy += Number(itemData.ENERGY_RES) || 0;
                result[location].radiation += Number(itemData.RADIATION_RES) || 0;
            }
        });
    });

    return result;
};
