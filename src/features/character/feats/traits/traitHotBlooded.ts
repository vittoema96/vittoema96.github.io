import type {
    SpecialModifier,
    TraitImplementation,
} from '@/features/character/feats/types.ts';

const traitHotBlooded: TraitImplementation = {
    id: 'traitHotBlooded',
    getDamageRatingBonus: character =>
        character.currentHp < Math.ceil(character.maxHp / 2) ? 1 : 0,
    getRollSpecialModifiers: character => {
        const modifiers: SpecialModifier[] = [];
        if (character.currentHp < Math.ceil(character.maxHp / 2)) {
            modifiers.push(
                {
                    special: 'perception',
                    apply: currentValue => currentValue - 2,
                },
                {
                    special: 'agility',
                    apply: currentValue => currentValue - 2,
                },
            );
        }
        return modifiers;
    },
};

export default traitHotBlooded;
