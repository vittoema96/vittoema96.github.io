import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitNomad: TraitImplementation = {
    id: 'traitNomad',
    getBlacklistedSpecialties: () => ['science'],
    // TODO add a Survival reroll for travel, camping, and foraging tests.
    // TODO ignore the first complication on those Survival tests.
    // TODO increase Barter and Speech difficulty/complication range in static settlements.
};

export default traitNomad;
