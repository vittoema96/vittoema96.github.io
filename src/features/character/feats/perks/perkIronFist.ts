import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

// "At rank 1, your unarmed attacks inflict +1 CD damage. At rank 2, your unarmed attacks also
// gain the Vicious damage effect." Every Unarmed weapon makes unarmed attacks: the Unarmed
// Strike, the Mr Handy Pincer, Knuckles, Power Fist, ...
const perkIronFist: PerkImplementation = {
    id: 'perkIronFist',
    getWeaponItemEffects: (item, perks) => {
        if (item.CATEGORY !== 'unarmed') {
            return [];
        }
        return perkRank(perks, 'perkIronFist') >= 2
            ? ['damageAdd:1', 'effectAdd:effectVicious']
            : ['damageAdd:1'];
    },
};

export default perkIronFist;
