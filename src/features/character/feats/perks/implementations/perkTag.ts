import { FeatImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


const perkTag: FeatImplementation = {
    getSpecialtyPointBonus: (ctx) => perkRank(ctx.character.perks, 'perkTag')
};

export default perkTag;
