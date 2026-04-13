// SPECIAL
export const SPECIAL = [
    'strength',
    'perception',
    'endurance',
    'charisma',
    'intelligence',
    'agility',
    'luck',
] as const;
export type SpecialType = (typeof SPECIAL)[number];
export function isCharacterSpecial(special: any): special is SpecialType {
    return SPECIAL.includes(special);
}

export const COMPANION_SPECIAL = ['body', 'mind'] as const;
export type CompanionSpecialType = (typeof COMPANION_SPECIAL)[number];
export function isCompanionSpecial(special: any): special is CompanionSpecialType {
    return COMPANION_SPECIAL.includes(special);
}

// SKILLS
export const SKILLS = [
    'athletics',
    'barter',
    'bigGuns',
    'energyWeapons',
    'explosives',
    'lockpick',
    'medicine',
    'meleeWeapons',
    'pilot',
    'repair',
    'science',
    'smallGuns',
    'sneak',
    'speech',
    'survival',
    'throwing',
    'unarmed',
] as const;
export type SkillType = (typeof SKILLS)[number];
export const isCharacterSkill = (val: any): val is SkillType => {
    return SKILLS.includes(val);
}

export const COMPANION_SKILLS = ['melee', 'guns', 'other'] as const;
export type CompanionSkillType = (typeof COMPANION_SKILLS)[number];
export const isCompanionSkill = (val: any): val is CompanionSkillType => {
    return COMPANION_SKILLS.includes(val);
}

const _SKILL_TO_SPECIAL_MAP: Record<SkillType, SpecialType> = {
    athletics: 'strength',
    barter: 'charisma',
    bigGuns: 'endurance',
    energyWeapons: 'perception',
    explosives: 'perception',
    lockpick: 'perception',
    medicine: 'intelligence',
    meleeWeapons: 'strength',
    pilot: 'perception',
    repair: 'intelligence',
    science: 'intelligence',
    smallGuns: 'agility',
    sneak: 'agility',
    speech: 'charisma',
    survival: 'endurance',
    throwing: 'agility',
    unarmed: 'strength',
} as const;

const _COMPANION_SKILL_TO_SPECIAL_MAP: Record<CompanionSkillType, CompanionSpecialType> = {
    melee: 'body', // Physical melee attacks use body
    guns: 'body', // Ranged attacks use body for coordination
    other: 'mind', // Technical/other skills use mind
} as const;

export function getSpecialFromSkill(skill: SkillType): SpecialType {
    return _SKILL_TO_SPECIAL_MAP[skill];
}
export function getSpecialFromSkillCompanion(skill: CompanionSkillType): CompanionSpecialType {
    return _COMPANION_SKILL_TO_SPECIAL_MAP[skill];
}
