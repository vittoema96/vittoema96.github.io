/**
 * Body location utilities
 * Centralized logic for mapping and handling body part locations
 */

/**
 * Get all body part locations
 * @param {string} origin - Character origin ('mrHandy', 'ghoul', 'human')
 * @returns {string[]} Array of all body part location names
 */
export const getBodyLocations = (origin) => {
    if (origin === 'mrHandy') {
        return ['robotOptics', 'robotBody', 'robotArms', 'robotThrusters']
    }
    return ['head', 'leftArm', 'rightArm', 'torso', 'leftLeg', 'rightLeg']
}

/**
 * Location mapping for optimized lookup
 * Maps generic location names to specific body parts
 */
const LOCATION_MAP = {
    arm: (side) => {
        if (side === 'left') return ['leftArm']
        if (side === 'right') return ['rightArm']
        return ['leftArm', 'rightArm']
    },
    arms: () => ['leftArm', 'rightArm'],
    leg: (side) => {
        if (side === 'left') return ['leftLeg']
        if (side === 'right') return ['rightLeg']
        return ['leftLeg', 'rightLeg']
    },
    legs: () => ['leftLeg', 'rightLeg'],
    torso: () => ['torso'],
    head: () => ['head'],
    // Robot parts mapping (for Mr. Handy) - each part has its own unique location
    robotOptics: () => ['robotOptics'],
    robotBody: () => ['robotBody'],
    robotArms: () => ['robotArms'],
    robotThrusters: () => ['robotThrusters']
}

/**
 * Map item location strings to specific body parts
 * @param {string[]} locationsCovered - Array of location strings from item data
 * @param {string} side - Side identifier ('left', 'right', or undefined)
 * @returns {string[]} Array of specific body part locations
 */
export const mapItemLocations = (locationsCovered, side) => {
    const locations = []
    
    for (const location of locationsCovered) {
        const mapper = LOCATION_MAP[location]
        if (mapper) {
            locations.push(...mapper(side))
        } else {
            // Fallback for unknown locations - use as-is
            locations.push(location)
        }
    }
    
    return locations
}

/**
 * Check if two location arrays have any overlap
 * @param {string[]} locations1 - First array of locations
 * @param {string[]} locations2 - Second array of locations
 * @returns {boolean} True if there's any overlap
 */
export const hasLocationOverlap = (locations1, locations2) => {
    return locations1.some(loc => locations2.includes(loc))
}

/**
 * Get item layer type (under/over/both)
 * @param {string} itemType - Item type
 * @returns {string} Layer type ('under', 'over', or 'both')
 */
export const getItemLayer = (itemType) => {
    if (itemType === 'clothing') return 'under'
    if (itemType === 'outfit') return 'both'
    if (itemType === 'headgear' || itemType.endsWith('Armor')) return 'over'
    return 'both' // Default to both for safety
}

/**
 * Check if two items have a layer conflict
 * @param {string} layer1 - First item's layer
 * @param {string} layer2 - Second item's layer
 * @returns {boolean} True if there's a layer conflict
 */
export const hasLayerConflict = (layer1, layer2) => {
    // clothing (under) + armor (over) = OK, no conflict
    // outfit (both) + anything = CONFLICT
    // armor (over) + armor (over) = CONFLICT
    return (
        layer1 === 'both' || // outfit conflicts with everything
        layer2 === 'both' || // outfit conflicts with everything
        (layer1 === 'over' && layer2 === 'over') // two armors conflict
    )
}

