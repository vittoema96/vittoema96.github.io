import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitRiteOfPassage: TraitImplementation = {
    id: 'traitRiteOfPassage',
    manualAction: {
        type: 'combatDice',
        label: 'traitRiteOfPassage',
        diceCount: 1,
        description: 'traitRiteOfPassageBenefit',
        luckOnEffect: 1,
    },
};

export default traitRiteOfPassage;
