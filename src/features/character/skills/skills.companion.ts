import { CompanionSpecialType } from '@/features/character/special/special.ts';

export const COMPANION_SKILLS = ['melee', 'guns', 'other'] as const;
export type CompanionSkillType = (typeof COMPANION_SKILLS)[number];
export const isCompanionSkill = (val: any): val is CompanionSkillType => {
    return COMPANION_SKILLS.includes(val);
};
const _COMPANION_SKILL_TO_SPECIAL_MAP: Record<CompanionSkillType, CompanionSpecialType> = {
    melee: 'body', // Physical melee attacks use body
    guns: 'body', // Ranged attacks use body for coordination
    other: 'mind', // Technical/other skills use mind
} as const;

export function getSpecialFromSkillCompanion(skill: CompanionSkillType): CompanionSpecialType {
    return _COMPANION_SKILL_TO_SPECIAL_MAP[skill];
}
