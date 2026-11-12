import type { SpecialType } from '@/features/character/special/special.ts';
import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitStealthBoyAddict_special: TraitImplementation = {
    id: 'traitStealthBoyAddict_special',
    getSpecialAllocationPointsBonus: () => 4,
    getMinSpecialValueModifier: special =>
        special === 'strength' || special === 'endurance' ? 2 : 0,
    getMaxSpecialValueModifier: (special: SpecialType) => {
        if (special === 'strength' || special === 'endurance') {
            return 2;
        }
        if (special === 'intelligence' || special === 'charisma') {
            return -2;
        }
        return 0;
    },
};

export default traitStealthBoyAddict_special;
