import { FeatImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


const perkTag: FeatImplementation = {
    getSpecialtyPointBonus: (ctx) => perkRank(ctx.character, 'perkTag')
};

export default perkTag;
