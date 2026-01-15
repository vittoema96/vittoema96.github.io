/**
 * Dice utility functions
 * Centralized logic for dice rolling and state management
 */

export interface DiceState {
    classes: (string | null)[];
    active: boolean[];
    rerolled: boolean[];
}

/**
 * Create initial dice state arrays
 */
export const createInitialDiceState = (count: number): DiceState => {
    return {
        classes: Array(count).fill(null),
        active: Array(count).fill(true),
        rerolled: Array(count).fill(false)
    };
};

/**
 * Create initial extra dice state arrays (inactive by default)
 */
export const createInitialExtraDiceState = (count: number): DiceState => {
    return {
        classes: Array(count).fill(null),
        active: Array(count).fill(false),
        rerolled: Array(count).fill(false)
    };
};

/**
 * Roll random hit location
 */
export const rollRandomHitLocation = (): string => {
    const locations = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    const weights = [1, 3, 1, 1, 1, 1]; // Torso has 3x weight
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < locations.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return locations[i];
        }
    }

    return 'torso'; // Fallback
};

