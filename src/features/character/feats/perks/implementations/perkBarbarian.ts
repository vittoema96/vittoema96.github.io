import { PerkImplementation } from '@/features/character/feats';
import { allItems } from '@/data';
import { isType } from '@/features/item/utils.ts';


const perkBarbarian: PerkImplementation = {
    id: 'perkBarbarian',
    getLocationDRBonus: (special, items) => {
        const isWearingPowerArmor = items.some(item => {
            if (!item.equipped) {
                return false;
            }
            const data = allItems[item.id];
            return isType(data, 'apparel') && data.CATEGORY === 'powerArmor'; // TODO fix it when powerArmor is implemented
        });
        let bonus = 0
        if(!isWearingPowerArmor) {
            if (special.strength >= 11) {bonus = 3}
            if (special.strength >= 9) {bonus = 2}
            if (special.strength >= 7) {bonus = 1}
        }
        if(bonus) { return {physical: bonus}}
        return {}
    }
}

export default perkBarbarian
