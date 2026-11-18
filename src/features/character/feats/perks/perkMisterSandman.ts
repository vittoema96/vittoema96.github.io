import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { apparel } from '@/data';


const perkMisterSandman: PerkImplementation = {
    id: 'perkMisterSandman',
    getDamageRatingBonus: (character, _, itemData, isSneakAttack) => {
        const hasSuppressor = itemData.QUALITIES.includes('qualitySuppressed');
        if(isSneakAttack && hasSuppressor
            && !character.items.some(i => i.equipped && apparel[i.id]?.CATEGORY === 'powerArmor')){
            return 2
        }
        return 0
    }
}

export default perkMisterSandman;
