// GameRules.js
import { SPECIAL, SKILLS, BODY_PARTS } from './constants.js';

export function getMaxHp(characterData) {
    return characterData.special[SPECIAL.ENDURANCE] + characterData.special[SPECIAL.LUCK] + characterData.level - 1;
}

export function getMeleeDamage(characterData) {
    const str = characterData.special[SPECIAL.STRENGTH];
    if (str < 7) return 0;
    if (str < 9) return 1;
    if (str < 11) return 2;
    return 3;
}

export function getMaxWeight(characterData) {
    return 75 + characterData.special[SPECIAL.STRENGTH] * 5;
}

export function getCurrentWeight(characterData, dataManager) {
    return characterData.items.reduce((total, item) => {
        const itemData = dataManager.getItem(item.id);
        const weight = Number(itemData?.WEIGHT) || 0;
        return total + (weight * (item.quantity || 1));
    }, 0);
}

// Calculate character's defense value based on agility
export function getDefense(characterData) {
    return characterData.special[SPECIAL.AGILITY] < 9 ? 1 : 2;
}

// Calculate character's initiative based on agility and perception
export function getInitiative(characterData) {
    return characterData.special[SPECIAL.AGILITY] + characterData.special[SPECIAL.PERCEPTION];
}

// Check if a skill is a melee combat skill
export function isMelee(skill) {
    return [SKILLS.UNARMED, SKILLS.MELEE_WEAPONS].includes(skill);
}

// Get the governing SPECIAL attribute for a skill
export function getGoverningSpecial(skill) {
    const skillToSpecialMap = {
        [SKILLS.ATHLETICS]: SPECIAL.STRENGTH,
        [SKILLS.BARTER]: SPECIAL.CHARISMA,
        [SKILLS.BIG_GUNS]: SPECIAL.ENDURANCE,
        [SKILLS.ENERGY_WEAPONS]: SPECIAL.PERCEPTION,
        [SKILLS.EXPLOSIVES]: SPECIAL.PERCEPTION,
        [SKILLS.LOCKPICK]: SPECIAL.PERCEPTION,
        [SKILLS.MEDICINE]: SPECIAL.INTELLIGENCE,
        [SKILLS.MELEE_WEAPONS]: SPECIAL.STRENGTH,
        [SKILLS.PILOT]: SPECIAL.PERCEPTION,
        [SKILLS.REPAIR]: SPECIAL.INTELLIGENCE,
        [SKILLS.SCIENCE]: SPECIAL.INTELLIGENCE,
        [SKILLS.SMALL_GUNS]: SPECIAL.AGILITY,
        [SKILLS.SNEAK]: SPECIAL.AGILITY,
        [SKILLS.SPEECH]: SPECIAL.CHARISMA,
        [SKILLS.SURVIVAL]: SPECIAL.ENDURANCE,
        [SKILLS.THROWING]: SPECIAL.AGILITY,
        [SKILLS.UNARMED]: SPECIAL.STRENGTH
    };
    return skillToSpecialMap[skill];
}

// Determine which armor layers an item type covers
export function getItemCoveredLayers(itemType) {
    const result = [];
    const isBoth = ["outfit", "headgear"].includes(itemType);

    if (itemType.endsWith("Armor") || isBoth) {
        result.push('over');
    }
    if (itemType === "clothing" || isBoth) {
        result.push('under');
    }
    return result;
}

// Calculate damage reduction for all body locations
export function getLocationsDR(characterData, dataManager) {
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
        if (!itemData || !itemData.LOCATIONS_COVERED) return;

        // Get locations this item covers
        const locations = [];
        for (let location of itemData.LOCATIONS_COVERED) {
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
}