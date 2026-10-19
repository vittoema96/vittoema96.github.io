import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkRefractor: PerkImplementation = {
    id: 'perkRefractor',
    getLocationDRBonus: (_, __, perks) => ({
        energy: perkRank(perks, 'perkRefractor'),
    }),
};

export default perkRefractor;
