import type { TraitImplementation } from '@/features/character/feats/types.ts';


const traitTriggerDiscipline: TraitImplementation = {
    id: 'traitTriggerDiscipline',
    getFireRateBonus: (_, weapon) => {
        if(['smallGuns', 'energyWeapons'].includes(weapon.CATEGORY) && Number(weapon.FIRE_RATE) > 0){
            return -1
        }
        return 0
    },
    getFreeRerolls: (_, weapon) => {
        if(weapon && ['smallGuns', 'energyWeapons'].includes(weapon.CATEGORY)){
            return 1
        }
        return 0
    }
}

export default traitTriggerDiscipline
