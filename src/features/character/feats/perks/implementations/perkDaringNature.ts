import { PerkImplementation } from '@/features/character/feats';


const perkDaringNature: PerkImplementation = {
    id: 'perkDaringNature',
    // TODO add the free reroll when a skill-check d20 is done with purchased AP (from the gm).
    getBlacklistedPerks: () => ['perkCautiousNature']
}

export default perkDaringNature;
