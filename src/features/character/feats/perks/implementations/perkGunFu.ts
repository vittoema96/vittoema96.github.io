import { PerkImplementation } from '@/features/character/feats';
import { isCloseCombat } from '@/features/item/utils.ts';
import { perkRank } from '@/features/character/feats/perks/perks.ts';

const perkGunFu: PerkImplementation = {
    id: 'perkGunFu',
    getRollActions: () => [{
        id: 'perkGunFu',
        isApplicable: (_, item) => !isCloseCombat(item.CATEGORY),
        getMaxUses: (char) => perkRank(char.perks, 'perkGunFu'),
        cost: {
            ammo: 1,
            ap: 1
        },
        getContent: (t, totalDamage) => {
            return `${t('damage')}: ${totalDamage}\n\n` +
                   `${t('confirmGunFu')} (1 ${t('ammo')})`
        }
    }]
}

export default perkGunFu;
