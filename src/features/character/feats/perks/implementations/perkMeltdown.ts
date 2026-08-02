import { PerkImplementation } from '@/features/character/feats';

export const perkMeltdown: PerkImplementation = {
    id: 'perkMeltdown',
    getRollActions: () => [{
        id: 'perkMeltdown',
        isApplicable: (_, item) => item.CATEGORY === 'energyWeapons',
        modalId: 'meltdown',

        getContent: () => '' // TODO not needed
    }]
};
// TODO "modal" actions should be better standardized

export default perkMeltdown;
