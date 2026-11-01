import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitNecroticPostHuman_radiationImmunity: TraitImplementation = {
    id: 'traitNecroticPostHuman_radiationImmunity',
    isRadiationImmune: () => true,
};

export default traitNecroticPostHuman_radiationImmunity;
