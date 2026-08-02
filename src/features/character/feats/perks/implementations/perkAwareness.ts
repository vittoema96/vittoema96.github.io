import { PerkImplementation } from '@/features/character/feats';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { Character } from '@/types';


const perkAwareness: PerkImplementation = {
    id: 'perkAwareness',
    getWeaponEffects: (_: Character, __: WeaponItem, isAiming: boolean)=> {
        if(isAiming){
            return ['effectPiercing:1']
        }
        return []
    }
}

export default perkAwareness;
