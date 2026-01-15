/**
 * Dice utility functions
 * Centralized logic for dice rolling and state management
 */

/**
 * Create initial dice state arrays
 * @param {number} count - Number of dice
 * @returns {Object} { classes, active, rerolled }
 */
export const createInitialDiceState = (count) => {
    return {
        classes: Array(count).fill(null),
        active: Array(count).fill(true),
        rerolled: Array(count).fill(false)
    }
}

/**
 * Create initial extra dice state arrays (inactive by default)
 * @param {number} count - Number of extra dice
 * @returns {Object} { classes, active, rerolled }
 */
export const createInitialExtraDiceState = (count) => {
    return {
        classes: Array(count).fill(null),
        active: Array(count).fill(false),
        rerolled: Array(count).fill(false)
    }
}

/**
 * Roll random hit location
 * @returns {string} Hit location (head, torso, leftArm, rightArm, leftLeg, rightLeg)
 */
export const rollRandomHitLocation = () => {
    const locations = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']
    const weights = [1, 3, 1, 1, 1, 1] // Torso has 3x weight
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    
    let random = Math.random() * totalWeight
    for (let i = 0; i < locations.length; i++) {
        random -= weights[i]
        if (random <= 0) {
            return locations[i]
        }
    }
    
    return 'torso' // Fallback
}

