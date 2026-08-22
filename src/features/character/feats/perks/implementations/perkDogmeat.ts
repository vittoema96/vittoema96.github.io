import { PerkImplementation } from '@/features/character/feats';
import { CompanionTypeDefinition } from '@/utils/companionTypes.ts';

export const defaultDog: CompanionTypeDefinition = {
    type: 'dog',
    special: {
        body: 5,
        mind: 3
    },
    skills: {
        melee: 4,
        guns: 0,
        other: 0
    },
    maxHp: 8,
    defense: 3,
    dr: {
        physical: 0,
        energy: 0,
        radiation: 0,
        poison: 0
    },
    items: []
}

const perkDogmeat: PerkImplementation = {
    id: "perkDogmeat",
    getAvailableCompanions: () => ['dog']
};

export default perkDogmeat;
