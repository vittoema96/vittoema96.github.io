import { PerkImplementation } from '@/features/character/feats';
import { isCloseCombat } from '@/features/item/utils.ts';


const perkCenterOfMass: PerkImplementation = {
    id: 'perkCenterOfMass',
    getFreeRerolls: (_, itemData, ctx) => {
        return itemData && !isCloseCombat(itemData.CATEGORY) && ctx?.hitLocation === 'torso' ? 1 : 0
    },
    getRollToggleables: (_, itemData) => {
        return !isCloseCombat(itemData.CATEGORY) ? { hitLocation: ['torso'] } : {}
    }
}

export default perkCenterOfMass;

