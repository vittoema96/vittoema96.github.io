import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMotherWasteland: TraitImplementation = {
    id: 'traitMotherWasteland',
    manualAction: {
        type: 'confirm',
        label: 'traitMotherWasteland',
        message: 'traitMotherWastelandBenefit',
        luckCost: 1,
    },
};

export default traitMotherWasteland;
