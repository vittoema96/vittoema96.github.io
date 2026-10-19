import type { PerkImplementation } from '@/features/character/feats/types.ts';

// TODO did we include EVERY shotgun here?
const perkShotgunSurgeon: PerkImplementation = {
    id: 'perkShotgunSurgeon',
    getWeaponItemEffects: itemData =>
        itemData.CATEGORY === 'smallGuns' &&
        [
            'weaponCombatShotgun',
            'weaponDoubleBarrelShotgun',
            'weaponGaussShotgun',
            'weaponPumpActionShotgun',
        ].includes(itemData.ID)
            ? ['effectAdd:effectPiercing:1']
            : [],
};

export default perkShotgunSurgeon;
