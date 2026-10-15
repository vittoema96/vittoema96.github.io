import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkStrongBack: PerkImplementation = {
    id: 'perkStrongBack',
    modifyMaxWeight: (currentMaxWeight, _, perks) =>
        currentMaxWeight + 12.5 * perkRank(perks, 'perkStrongBack'),
};

export default perkStrongBack;
