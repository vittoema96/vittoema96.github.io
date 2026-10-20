import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { isCloseCombat } from '@/features/item/utils.ts';

const perkOverlyGenerous: PerkImplementation = {
    id: 'perkOverlyGenerous',
    getWeaponEffects: (character, itemData) =>
        character.rads >= character.maxHp / 4 && isCloseCombat(itemData.CATEGORY)
            ? ['effectRadioactive:1']
            : [],
};

export default perkOverlyGenerous;
