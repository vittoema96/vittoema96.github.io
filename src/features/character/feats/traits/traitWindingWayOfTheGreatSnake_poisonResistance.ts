import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitWindingWayOfTheGreatSnake_poisonResistance: TraitImplementation = {
    id: 'traitWindingWayOfTheGreatSnake_poisonResistance',
    getPoisonResistance: (level: number) => 1 + Math.floor(Math.max(level - 1, 0) / 5),
};

export default traitWindingWayOfTheGreatSnake_poisonResistance;
