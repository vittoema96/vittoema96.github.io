import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { isCloseCombat } from '@/features/item/utils.ts';


const perkCenterOfMass: PerkImplementation = {
    id: 'perkCenterOfMass',
    // TODO: Resolve "Torso or equivalent" against target-specific hit-location
    //       tables; the current toggle only supports the standard torso.
    getFreeRerolls: (_, itemData, ctx) => {
        return itemData && !isCloseCombat(itemData.CATEGORY) && ctx?.hitLocation === 'torso' ? 1 : 0
    },
    getRollToggleables: (_, itemData) => {
        return !isCloseCombat(itemData.CATEGORY) ? { hitLocation: ['torso'] } : {}
    }
}

export default perkCenterOfMass;
