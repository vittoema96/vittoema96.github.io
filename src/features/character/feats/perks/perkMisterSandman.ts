import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { apparel } from '@/data';


const perkMisterSandman: PerkImplementation = {
    id: 'perkMisterSandman',
    getDamageRatingBonus: (character, item, _, isSneakAttack) => {
        const hasSuppressor = item.mods.includes('modSuppressor');
        if(isSneakAttack && hasSuppressor
            && !character.items.some(i => i.equipped && apparel[i.id]?.CATEGORY === 'powerArmor')){
            return 2
        }
        return 0
    }
}

export default perkMisterSandman;
