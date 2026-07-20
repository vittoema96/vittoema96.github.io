import { useState } from 'react';

/**
 * Returns states and state setters for:
 * - dice values (number | '?')
 * - dice active (boolean)
 * - dice rerolled (boolean)
 * @param diceNumber all 3 states will have diceNumber dice
 * @param activeDice number of active = true
 * @param rerolledDice number of rerolled = true
 */
export default function useDice(
    diceNumber: number,
    activeDice: number,
    rerolledDice: number
) {
    const [value, setValue] = useState<Array<number | '?'>>(
        new Array(diceNumber).fill('?')
    );
    const [active, setActive] = useState<Array<boolean>>(
        Array.from({ length: diceNumber }, (_, i) => i < activeDice)
    );
    const [rerolled, setRerolled] = useState<Array<boolean>>(
        Array.from({ length: diceNumber }, (_, i) => i < rerolledDice)
    );
    return [
        value, setValue,
        active, setActive,
        rerolled, setRerolled
    ] as const;
}
