import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkRadResistant: PerkImplementation = {
    id: 'perkRadResistant',
    getLocationDRBonus: (_, __, perks) => ({
        radiation: perkRank(perks, 'perkRadResistant'),
    }),
};

export default perkRadResistant;
