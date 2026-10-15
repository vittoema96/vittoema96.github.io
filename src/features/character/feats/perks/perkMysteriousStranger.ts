import type { PerkImplementation } from '@/features/character/feats/types.ts';
import type { Character, CharacterItem } from '@/types';

/** Mysterious Stranger's 44 Magnum */
export const MYSTERIOUS_44_MAGNUM: CharacterItem = {
    id: 'weaponFortyFourPistol', // Mysterious Stranger's signature weapon
    quantity: 1,
    equipped: true,
    mods: ['modMarksmanGrip', 'modPowerful'],
};
/** Combat profile only: no save-schema dependency in an eagerly discovered feat. */
export const MYSTERIOUS_STRANGER: Pick<
    Character,
    'special' | 'skills' | 'specialties' | 'traits' | 'items'
> = {
    special: {
        strength: 4,
        perception: 4,
        endurance: 4,
        charisma: 4,
        intelligence: 4,
        agility: 10,
        luck: 4,
    },
    skills: {
        athletics: 0,
        barter: 0,
        bigGuns: 0,
        energyWeapons: 0,
        explosives: 0,
        lockpick: 0,
        medicine: 0,
        meleeWeapons: 0,
        pilot: 0,
        repair: 0,
        science: 0,
        smallGuns: 6,
        sneak: 0,
        speech: 0,
        survival: 0,
        throwing: 0,
        unarmed: 0,
    },
    specialties: ['smallGuns'],
    traits: [],
    items: [MYSTERIOUS_44_MAGNUM],
};

// TODO isolate the stranger's damage from player weapon bonuses in the dice pipeline.
export const perkMysteriousStranger: PerkImplementation = {
    id: 'perkMysteriousStranger',
    manualAction: {
        type: 'skillRoll',
        label: 'summonStranger',
        skillId: 'smallGuns',
        usingItem: MYSTERIOUS_44_MAGNUM,
        roller: 'mysteriousStranger',
        requiredLuck: 1,
    },
};

export default perkMysteriousStranger;
