import { FeatImplementation } from '@/features/character/feats';
import { CompanionTypeDefinition } from '@/utils/companionTypes.ts';

// TODO implement
export const defaultEyebot: CompanionTypeDefinition = {
    id: 'eyebot',
    special: {
        body: 4,
        mind: 4
    },
    skills: {
        melee: 0,
        guns: 3,
        other: 1
    },
    baseHp: 5,
    baseDefense: 2,
    baseDR: {
        physical: 2,
        energy: 2,
        radiation: Infinity, // Immune
        poison: Infinity     // Immune
    },
    weapons: [
        {
            id: 'weaponCompanionLaser',
            customName: 'LASER',
            skill: 'guns'
        }
    ]
}

const perkRobotWrangler: FeatImplementation = {
    getAvailableCompanions: () => ['eyebot']
};

export default perkRobotWrangler;
