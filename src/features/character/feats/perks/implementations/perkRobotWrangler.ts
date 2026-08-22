import { PerkImplementation } from '@/features/character/feats';
import { CompanionTypeDefinition } from '@/utils/companionTypes.ts';

// TODO implement
export const defaultEyebot: CompanionTypeDefinition = {
    type: 'eyebot',
    special: {
        body: 4,
        mind: 4
    },
    skills: {
        melee: 0,
        guns: 3,
        other: 1
    },
    maxHp: 5,
    defense: 2,
    dr: {
        physical: 2,
        energy: 2,
        radiation: Infinity, // Immune
        poison: Infinity     // Immune
    },
    items: [
        {
            id: 'weaponCompanionLaser',
            customName: 'LASER',
            skill: 'guns',
            quantity: 1,
            mods: []
        }
    ]
}

const perkRobotWrangler: PerkImplementation = {
    id: 'perkRobotWrangler',
    getAvailableCompanions: () => ['eyebot']
};

export default perkRobotWrangler;
