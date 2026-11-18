import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { isCloseCombat } from '@/features/item/utils.ts';

const perkSlayer: PerkImplementation = {
    id: 'perkSlayer',
    // TODO: Require damage to have been dealt, then apply a critical hit and
    //       injury at the actual hit location through the combat result pipeline.
    getRollActions: () => [{
        id: 'perkSlayer',
        isApplicable: (_, item) => isCloseCombat(item.CATEGORY),
        cost: { luck: 1 },
        getContent: t => t('confirmSlayer')
    }],
};

export default perkSlayer;
