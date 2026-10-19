import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { apparel } from '@/data';

const perkCovertOperator: PerkImplementation = {
    id: 'perkCovertOperator',
    getDamageRatingBonus: (character, _item, itemData, isSneakAttack) => {
        const wearingPowerArmor = character.items.some(
            equippedItem =>
                equippedItem.equipped && apparel[equippedItem.id]?.CATEGORY === 'powerArmor',
        );
        return isSneakAttack &&
            ['smallGuns', 'energyWeapons'].includes(itemData.CATEGORY) &&
            !wearingPowerArmor
            ? 2
            : 0;
    },
};

export default perkCovertOperator;
