import { PerkImplementation } from '@/features/character/feats';
import { RawCharacter } from '@/types';
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';

/** Mysterious Stranger's 44 Magnum */
export const MYSTERIOUS_44_MAGNUM = {
    id: 'weaponFortyFourPistol', // Mysterious Stranger's signature weapon
    quantity: 1,
    equipped: true,
    mods: ['modMarksmanGrip', 'modPowerful'],
}
/** Mysterious Stranger character */
export const MYSTERIOUS_STRANGER: RawCharacter = RawCharacterSchema.parse({
    name: 'Mysterious Stranger',
    special: { agility: 10 },
    skills: { smallGuns: 6 },
    specialties: ['smallGuns'],
    items: [ MYSTERIOUS_44_MAGNUM ],
    maxHp: 9999,
})


// TODO implement perk correctly
export const perkMysteriousStranger: PerkImplementation = {
    id: 'perkMysteriousStranger',
}

export default perkMysteriousStranger;
