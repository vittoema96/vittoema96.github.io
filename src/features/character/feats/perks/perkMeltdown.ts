import type { PerkImplementation } from '@/features/character/feats/types.ts';

export const perkMeltdown: PerkImplementation = {
    id: 'perkMeltdown',
    getRollActions: () => [{
        id: 'perkMeltdown',
        isApplicable: (_, item) => item.CATEGORY === 'energyWeapons',
        modalId: 'meltdown',

        // TODO define modal content through the action contract instead of returning an empty string.
        getContent: () => ''
    }]
};
// TODO "modal" actions should be better standardized

export default perkMeltdown;
