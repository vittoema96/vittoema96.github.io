import type {GenericBodyPart} from '@/types';

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
export const hasLocationOverlap = (locations1: string[], locations2: string[]): boolean => {
    return locations1.some(loc => locations2.includes(loc));
};

/**
 * Get item layer type (under/over/both)
 */
export const getItemLayer = (itemType: string): 'under' | 'over' | 'both' => {
    if (itemType === 'clothing') {return 'under';}
    if (itemType === 'outfit') {return 'both';}
    if (itemType === 'headgear' || itemType.endsWith('Armor')) {return 'over';}
    return 'both'; // Default to both for safety
};

/**
 * Check if two items have a layer conflict
 */
export const hasLayerConflict = (layer1: string, layer2: string): boolean => {
    // clothing (under) + armor (over) = OK, no conflict
    // outfit (both) + anything = CONFLICT
    // armor (over) + armor (over) = CONFLICT
    return (
        layer1 === 'both' || // outfit conflicts with everything
        layer2 === 'both' || // outfit conflicts with everything
        (layer1 === 'over' && layer2 === 'over') // two armors conflict
    );
};

