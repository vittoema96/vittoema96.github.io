import { PerkImplementation } from '@/features/character/feats';


const perkDaringNature: PerkImplementation = {
    id: 'perkDaringNature',
    // TODO add other effects
    getBlacklistedPerks: () => ['perkCautiousNature']
}

export default perkDaringNature;
