import { PerkImplementation } from '@/features/character/feats';


const perkCautiousNature: PerkImplementation = {
    id: 'perkCautiousNature',
    getFreeRerolls: (_, __, ctx) => {
        if(ctx?.bought ?? 0){
            return 1
        }
        return 0
    },
    getBlacklistedPerks: () => ['perkDaringNature']
}

export default perkCautiousNature;
