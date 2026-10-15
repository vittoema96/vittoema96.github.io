import type { TraitImplementation } from '@/features/character/feats/types.ts';
import { SkillType } from '@/features/character/skills/skills.ts';

const GOOD_NATURED_SKILLS: SkillType[] = [
    'speech',
    'medicine',
    'repair',
    'science',
    'barter',
];

const traitGoodNatured: TraitImplementation = {
    id: 'traitGoodNatured',
    getSpecialtySkillBonuses: () => [{
        bonus: 2,
        skills: GOOD_NATURED_SKILLS,
    }],
    getSkillMaxModifier: (skillId, isSpecialty) => (
        !isSpecialty && GOOD_NATURED_SKILLS.includes(skillId) ? -2 : 0
    ),
};

export default traitGoodNatured;
