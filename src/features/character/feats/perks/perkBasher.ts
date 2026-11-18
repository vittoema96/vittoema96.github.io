import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { allItems } from '@/data';
import { isType } from '@/features/item/utils.ts';

const perkBasher: PerkImplementation = {
    id: 'perkBasher',
    getWeaponItemEffects: (itemData, _, inventoryItems = []) => {
        const hasPistol = inventoryItems.some(item => {
            const data = allItems[item.id];
            return isType(data, 'weapon') && data.TAGS.includes('pistol');
        });
        return itemData.ID === 'weaponWeaponStockOneHanded' && hasPistol
            ? ['effectAdd:effectVicious']
            : [];
    },
};

export default perkBasher;
