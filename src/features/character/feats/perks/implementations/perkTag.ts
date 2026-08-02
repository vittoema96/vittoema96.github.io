import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


const perkTag: PerkImplementation = {
    id: 'perkTag',
    getSpecialtyPointBonus: (character) => perkRank(character.perks, 'perkTag')
};

export default perkTag;
