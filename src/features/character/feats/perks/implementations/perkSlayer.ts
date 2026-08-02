import { PerkImplementation } from '@/features/character/feats';
import { isCloseCombat } from '@/features/item/utils.ts';

const perkSlayer: PerkImplementation = {
    id: 'perkSlayer',
    getRollActions: () => [{
        id: 'perkSlayer',
        isApplicable: (_, item) => isCloseCombat(item.CATEGORY),
        cost: { luck: 1 },
        getContent: t => t('confirmSlayer')
    }],
};

export default perkSlayer;
