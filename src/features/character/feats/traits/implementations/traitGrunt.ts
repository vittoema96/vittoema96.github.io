import { FeatImplementation } from '@/features/character/feats';


export const traitGrunt: FeatImplementation = {
    getDamageRatingBonus: (_, itemData) => {
        // TODO check id consistencies and eventually add actual validation
        if([
            'weaponCombatRifle', 'weaponAssaultRifle',
            'weaponFragmentationGrenade', 'weaponCombatKnife',
            // TODO all these machine gun types? it says generically "machine guns"
            'weaponMachineGun', 'weaponLightMachineGun', 'weapon50caMachineGun'
        ].includes(itemData.ID)){
            return 1;
        }
        return 0
    }
}

export default traitGrunt;
