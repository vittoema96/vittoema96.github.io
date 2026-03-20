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
 * Roll a random d20 for hit location
 */
export const rollD20 = (): number => {
    return Math.floor(Math.random() * 20) + 1;
};

/**
 * Creature type for hit location mapping
 */
export type CreatureType = 'humanoid' | 'mrHandy';

/**
 * Get hit location from a d20 roll based on creature type
 * @param roll - The d20 roll result (1-20)
 * @param creatureType - The type of creature being hit
 * @returns The body part hit
 */
export const getHitLocationFromRoll = (roll: number, creatureType: CreatureType): string => {
    // Humanoid hit location table (d20)
    // 1-2: Head
    // 3-8: Torso
    // 9-11: Left Arm
    // 12-14: Right Arm
    // 15-17: Left Leg
    // 18-20: Right Leg

    if (creatureType === 'humanoid') {
        if (roll <= 2) { return 'head';  }
        if (roll <= 8) { return 'torso'; }
        if (roll <= 11) { return 'leftArm'; }
        if (roll <= 14) { return 'rightArm'; }
        if (roll <= 17) { return 'leftLeg'; }
        return 'rightLeg';
    }
    if(creatureType === "mrHandy") {
        if (roll <= 2) { return 'robotPartSensors'; }
        if (roll <= 8) { return 'robotPartBody'; }
        if (roll <= 11) { return 'robotPartArm1'; }
        if (roll <= 14) { return 'robotPartArm2'; }
        if (roll <= 17) { return 'robotPartArm3'; }
        return 'robotPartThrusters';
    }

    return 'torso'; // Fallback
};

