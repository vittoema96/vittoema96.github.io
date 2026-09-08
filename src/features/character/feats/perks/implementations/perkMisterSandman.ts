import { PerkImplementation } from '@/features/character/feats';
import { apparel } from '@/data';


const perkMisterSandman: PerkImplementation = {
    id: 'perkMisterSandman',
    getDamageRatingBonus: (character, item, isSneakAttack) => {
        const hasSuppressor = item.mods.includes('modSuppressor');
        if(isSneakAttack && hasSuppressor
            && !character.items.some(i => i.equipped && apparel[i.id]?.CATEGORY === 'powerArmor')){
            return 2
        }
        return 0
    }
}

export default perkMisterSandman;
