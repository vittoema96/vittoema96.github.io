import { TraitImplementation } from '@/features/character/feats';
import { Character } from '@/types';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';


const traitTriggerDiscipline: TraitImplementation = {
    id: 'traitTriggerDiscipline',
    getFireRateBonus: (_: Character, weapon: WeaponItem) => {
        if(['smallGuns', 'energyWeapons'].includes(weapon.CATEGORY) && Number(weapon.FIRE_RATE) > 0){
            return -1
        }
        return 0
    },
    getFreeRerolls: (_: Character, weapon: WeaponItem) => {
        if(['smallGuns', 'energyWeapons'].includes(weapon.CATEGORY)){
            return 1
        }
        return 0
    }
}

export default traitTriggerDiscipline
