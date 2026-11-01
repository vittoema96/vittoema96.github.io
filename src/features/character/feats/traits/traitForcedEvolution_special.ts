import type { SpecialType } from '@/features/character/special/special.ts';
import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitForcedEvolution_special: TraitImplementation = {
    id: 'traitForcedEvolution_special',
    getSpecialAllocationPointsBonus: () => 4,
    getMinSpecialValueModifier: (special: SpecialType) =>
        special === 'strength' || special === 'endurance' ? 2 : 0,
    getMaxSpecialValueModifier: (special: SpecialType) => {
        if (special === 'strength' || special === 'endurance') {
            return 2;
        }
        if (special === 'intelligence' || special === 'charisma') {
            return -4;
        }
        return 0;
    },
};

export default traitForcedEvolution_special;
