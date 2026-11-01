import type { TraitImplementation } from '@/features/character/feats/types.ts';
import type { SkillType } from '@/features/character/skills/skills.ts';

const traitWindingWayOfTheGreatSnake_tagSkill: TraitImplementation = {
    id: 'traitWindingWayOfTheGreatSnake_tagSkill',
    // TODO: Implement Chemistry/Cooking Station poison crafting, material
    //       consumption, and the temporary Persistent (Poison) weapon effect.
    getSpecialtySkillBonuses: () => [
        {
            bonus: 1,
            skills: ['medicine', 'sneak'] as SkillType[],
        },
    ],
};

export default traitWindingWayOfTheGreatSnake_tagSkill;
