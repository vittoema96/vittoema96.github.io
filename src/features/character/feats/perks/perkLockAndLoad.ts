import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

// TODO Do we applicate this AFTER calculating fire rate?
const perkLockAndLoad: PerkImplementation = {
    id: 'perkLockAndLoad',
    getFireRateBonus: (character, itemData) =>
        itemData.CATEGORY === 'bigGuns' && Number(itemData.FIRE_RATE) > 0
            ? perkRank(character.perks, 'perkLockAndLoad')
            : 0,
};

export default perkLockAndLoad;
