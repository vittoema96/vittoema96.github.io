import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { Character } from '@/types';


const perkAwareness: PerkImplementation = {
    id: 'perkAwareness',
    // TODO: Require Aim against a Close-range target and carry the bonus to the
    //       next attack against that target, increasing existing Piercing X.
    getWeaponEffects: (_: Character, __: WeaponItem, isAiming: boolean)=> {
        if(isAiming){
            return ['effectPiercing:1']
        }
        return []
    }
}

export default perkAwareness;
