import { TraitImplementation } from '@/features/character/feats';

const traitSmallFrame: TraitImplementation = {
    id: 'traitSmallFrame',
    getMaxWeightOverride: (special) => 75 + special.strength * 2.5,
};

// TODO could add a checkable "isContorsionOrBalance"
//  when rolling dice so that a "free" d20 reroll is accounted for
//  as currently the "bonus" of the trait is up to the user

export default traitSmallFrame;


