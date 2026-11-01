import type { TraitImplementation } from '@/features/character/feats/types.ts';
import type { SkillType } from '@/features/character/skills/skills.ts';

const traitTryingToMakeADifference_tagSkill: TraitImplementation = {
    id: 'traitTryingToMakeADifference_tagSkill',
    // TODO: Implement sincere-help Speech rerolls, the intimidation difficulty
    //       penalty, the non-lethal 0 HP rule, and Luck loss for indirect kills.
    getSpecialtySkillBonuses: () => [
        {
            bonus: 1,
            skills: ['medicine', 'repair', 'science', 'speech'] as SkillType[],
        },
    ],
};

export default traitTryingToMakeADifference_tagSkill;
