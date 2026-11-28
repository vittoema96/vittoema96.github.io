import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { allItems } from '@/data';
import { isType } from '@/features/item/utils.ts';

// Wanderers DLC "Evasive". The Corebook perk with the same Italian name is perkDodger.
const perkEvasive: PerkImplementation = {
    id: 'perkEvasive',
    getLocationDRBonus: (special, items, _perks, _traits, { isEncumbered }) => {
        const isWearingPowerArmor = items.some(item => {
            if (!item.equipped) {
                return false;
            }
            const data = allItems[item.id];
            return isType(data, 'apparel') && data.CATEGORY === 'powerArmor'; // TODO fix it when powerArmor is implemented
        });
        if (isWearingPowerArmor || isEncumbered || special.agility < 7) {
            return {};
        }
        const bonus = special.agility >= 11 ? 3 : special.agility >= 9 ? 2 : 1;
        return { physical: bonus, energy: bonus };
    },
};

export default perkEvasive;
