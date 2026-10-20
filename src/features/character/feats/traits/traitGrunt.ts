import type { TraitImplementation } from '@/features/character/feats/types.ts';

export const traitGrunt: TraitImplementation = {
    id: 'traitGrunt',
    getDamageRatingBonus: (_, __, itemData) => {
        const gruntTags = [
            'submachineGun',
            'combatRifle',
            'assaultRifle',
            'fragGrenade',
            'combatKnife',
        ];

        return gruntTags.some(tag => itemData.TAGS.includes(tag)) ? 1 : 0;
    },
    getRollComplicationModifiers: (_, context) => {
        if (['energyWeapons', 'bigGuns'].includes(context.itemData?.CATEGORY ?? '')) {
            return { thresholdDelta: -2 };
        }
        return {};
    },
};

export default traitGrunt;
