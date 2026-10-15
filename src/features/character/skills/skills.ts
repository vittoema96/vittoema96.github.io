// SKILLS
import { SpecialMap, SpecialType } from '@/features/character/special/special.ts';
import { RawCharacter } from '@/types';
import type { Origin } from '@/features/character/origins/types';
import { PerkId } from '@/features/character/feats/perks.ts';
import { getSkillMaxModifier, getSkillPointsBonus } from '@/features/character/feats/rules';
import { TraitId } from '@/features/character/feats/traits.ts';
import { CompanionSpecialType } from '@/features/character/special/special.companion.ts';

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

export const COMPANION_SKILLS = ['melee', 'guns', 'other'] as const;
export type CompanionSkillType = (typeof COMPANION_SKILLS)[number];


export const isCharacterSkill = (val: any): val is SkillType => {
    return SKILLS.includes(val);
};
export const isCompanionSkill = (val: any): val is CompanionSkillType => {
    return COMPANION_SKILLS.includes(val);
};


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

export function calculateSkills(
    raw: RawCharacter,
    specialties: SkillType[],
    origin: Origin,
    perks: PerkId[] = [],
    traits: TraitId[] = [],
) {
    return SKILLS.reduce((
        skills,
        skillId
    ) => {
        const baseValue = raw.skills[skillId];
        const hasSpecialty = specialties.includes(skillId);
        const skillValue = baseValue + (hasSpecialty ? 2 : 0);
        const skillMax = origin.skillMaxValue + getSkillMaxModifier(
            skillId,
            hasSpecialty,
            perks,
            traits,
            origin,
        );
        skills[skillId] = Math.min(skillValue, skillMax);
        return skills
    }, {} as Record<SkillType, number>)
}

export function calculateSkillPoints(
    special: SpecialMap,
    skills: Record<SkillType, number>,
    specialties: SkillType[],
    level: number,
    perks: PerkId[],
    traits: TraitId[] = [],
    origin?: Origin,
) {
    const skillSum =
            Object.values(skills).reduce((total, value) => total + value, 0) -
            specialties.length * 2;
    return 9 + special.intelligence
        + (level - 1)
        + getSkillPointsBonus(perks, traits, origin)
        - skillSum;
}
