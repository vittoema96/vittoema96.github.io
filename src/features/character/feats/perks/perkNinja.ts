import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { apparel } from '@/data';
import { isCloseCombat } from '@/features/item/utils.ts';

const perkNinja: PerkImplementation = {
    id: 'perkNinja',
    getDamageRatingBonus: (character, _item, itemData, isSneakAttack) => {
        const wearingPowerArmor = character.items.some(
            equippedItem =>
                equippedItem.equipped && apparel[equippedItem.id]?.CATEGORY === 'powerArmor',
        );
        return isSneakAttack && isCloseCombat(itemData.CATEGORY) && !wearingPowerArmor ? 2 : 0;
    },
};

export default perkNinja;
