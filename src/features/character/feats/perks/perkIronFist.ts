import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkIronFist: PerkImplementation = {
    id: 'perkIronFist',
    getGrantedItems: () => {
        return [{
            id: 'weaponIronFist',
            quantity: 1,
            mods: [],
            equipped: false,
            replaces: ['weaponUnarmedStrike', 'weaponMrHandyPliers'],
        }];
    },
    getWeaponItemEffects: (item, perks) =>
        item.ID === 'weaponIronFist' && perkRank(perks, 'perkIronFist') >= 2
            ? ['effectAdd:effectVicious']
            : [],
};

export default perkIronFist;
