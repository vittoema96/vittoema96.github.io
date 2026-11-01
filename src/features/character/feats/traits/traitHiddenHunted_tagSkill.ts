import type { TraitImplementation } from '@/features/character/feats/types.ts';
import type { SkillType } from '@/features/character/skills/skills.ts';

const traitHiddenHunted_tagSkill: TraitImplementation = {
    id: 'traitHiddenHunted_tagSkill',
    // TODO: Implement supply-cache creation/retrieval and the identity-exposure,
    //       faction-hostility, reputation, and bounty-hunter consequences.
    getSpecialtySkillBonuses: () => [
        {
            bonus: 1,
            skills: ['sneak', 'survival'] as SkillType[],
        },
    ],
};

export default traitHiddenHunted_tagSkill;
