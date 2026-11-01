import type { SkillType } from '@/features/character/skills/skills.ts';
import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitTheChainThatBinds_tagSkill: TraitImplementation = {
    id: 'traitTheChainThatBinds_tagSkill',
    getSpecialtySkillBonuses: () => [
        {
            bonus: 1,
            skills: ['energyWeapons', 'science', 'repair'] as SkillType[],
        },
    ],
};

export default traitTheChainThatBinds_tagSkill;
