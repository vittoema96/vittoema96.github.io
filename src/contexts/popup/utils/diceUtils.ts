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
export const createInitialDiceState = (count: number, active: boolean = true): DiceState => {
    return {
        classes: new Array(count).fill(null),
        active: new Array(count).fill(active),
        rerolled: new Array(count).fill(false)
    };
};

/**
 * Roll random hit location
 */
export const rollRandomHitLocation = (): string => {
    const locationWeights = {
        'head': 2,
        'torso': 6,
        'leftArm': 3,
        'rightArm': 3,
        'leftLeg': 3,
        'rightLeg': 3
    }

    let random = Math.random() * 20;
    for (const [location, weight] of Object.entries(locationWeights)) {
        if (random <= weight) {
            return location;
        }
        random -= weight;
    }

    return 'torso'; // Fallback
};

