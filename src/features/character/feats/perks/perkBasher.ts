import type { PerkImplementation } from '@/features/character/feats/types.ts';

// "When you make a melee attack by bashing with your gun, your attack gains the Vicious damage effect."
const GUN_BASH_IDS = ['weaponWeaponStockOneHanded', 'weaponWeaponStock'];

const perkBasher: PerkImplementation = {
    id: 'perkBasher',
    getWeaponItemEffects: itemData =>
        GUN_BASH_IDS.includes(itemData.ID) ? ['effectAdd:effectVicious'] : [],
};

export default perkBasher;
