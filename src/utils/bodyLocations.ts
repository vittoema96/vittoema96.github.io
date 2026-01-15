import type { ApparelCategories, CharacterItem, GenericBodyPart } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase';

/**
 * Body location utilities
 * Centralized logic for mapping and handling body part locations
 */

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const getLocations = (bodyPart: GenericBodyPart | 'arm' | 'arms' | 'leg' | 'legs', side?: string) => {
    if(['arm', 'arms', 'leg', 'legs'].includes(bodyPart)) {
        const part = capitalize(bodyPart.substring(0, 3))
        const leftPart = `left${part}` as 'leftArm' | 'leftLeg';
        const rightPart = `right${part}` as 'rightArm' | 'rightLeg';
        if(side === 'left') {return [leftPart];}
        if(side === 'right') {return [rightPart];}
        return [leftPart, rightPart]
    }
    return [bodyPart as GenericBodyPart]
}

/**
 * Map item location strings to specific body parts
 */
export const mapItemLocations = (locationsCovered: (GenericBodyPart | 'arm' | 'arms' | 'leg' | 'legs')[], side?: string): GenericBodyPart[] => {
    const locations: GenericBodyPart[] = [];
    const locationsArray = Array.isArray(locationsCovered) ? locationsCovered : [locationsCovered];

    for (const location of locationsArray) {
        locations.push(...getLocations(location, side));
    }

    return locations;
};

/**
 * Check if two location arrays have any overlap
 */

export function hasApparelConflict(item1: CharacterItem, item2: CharacterItem) {
    const dataManager = getGameDatabase()
    const itemData1 = dataManager.getItem(item1.id)
    const itemData2 = dataManager.getItem(item2.id)
    if(!dataManager.isType(itemData1, 'apparel') || !dataManager.isType(itemData2, 'apparel')) {
        return false
    }

    // Has location conflict
    const locations1 = mapItemLocations(itemData1.LOCATIONS_COVERED, item1.variation);
    const locations2 = mapItemLocations(itemData2.LOCATIONS_COVERED, item2.variation);
    const hasLocationOverlap = locations1.some(loc => locations2.includes(loc));
    if(!hasLocationOverlap) { return false }

    // Has layer conflict
    const layer1 = getItemLayer(itemData1.CATEGORY);
    const layer2 = getItemLayer(itemData2.CATEGORY);
    return layer1 === 'both' || layer2 === 'both' || layer1 === layer2;
}


type ItemLayer = 'under' | 'over' | 'both';
const getItemLayer = (itemCategory: ApparelCategories): ItemLayer => {
    switch (itemCategory) {
        case 'clothing':
            return 'under';
        case 'outfit':
        case 'robotPart':
        case 'headgear':
            return 'both';
        case 'raiderArmor':
        case 'leatherArmor':
        case 'metalArmor':
        case 'combatArmor':
        case 'syntheticArmor':
        case 'vaultTecSecurity':
            return 'over';
    }
};

