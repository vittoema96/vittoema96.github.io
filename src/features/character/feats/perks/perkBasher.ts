import type { PerkImplementation } from '@/features/character/feats/types.ts';

function isPistol(itemTags: string[]): boolean {
    return itemTags.includes('pistol');
}

const perkBasher: PerkImplementation = {
    id: 'perkBasher',
    getWeaponItemEffects: itemData => (isPistol(itemData.TAGS) ? ['effectAdd:effectVicious'] : []),
};

export default perkBasher;
