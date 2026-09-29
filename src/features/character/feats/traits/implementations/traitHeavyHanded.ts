import { TraitImplementation } from '@/features/character/feats';

const traitHeavyHanded: TraitImplementation = {
    id: 'traitHeavyHanded',
    getMeleeDamageBonus: () => 1,
    getRollComplicationModifiers: (_, context) => {
        const isCloseCombat =
            ['meleeWeapons', 'unarmed'].includes(
                context.itemData?.CATEGORY ?? context.skillId ?? ''
            )
        if (isCloseCombat) {
            return { additionalThresholds: [19] };
        }
        return {};
    },
};

export default traitHeavyHanded;



