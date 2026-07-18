// SKILLS
import { CompanionSpecialType, SpecialType } from '@/features/character/special/special.ts';
import { Character, RawCharacter } from '@/types';
import { useMemo } from 'react';
import { Origin } from '@/features/character/origin.ts';
import { perkRank } from '@/features/character/feats/perks/perks.ts';

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

export function useSkills(raw: RawCharacter, specialties: SkillType[], origin: Origin) {
    return useMemo(
        () => SKILLS.reduce((skills, skillId) => {

            const baseValue = raw.skills[skillId];
            const hasSpecialty = specialties.includes(skillId);
            const skillValue = baseValue + (hasSpecialty ? 2 : 0);
            skills[skillId] = Math.min(skillValue, origin.skillMaxValue);
            return skills
        }, {} as Record<SkillType, number>),
        [origin.skillMaxValue, raw.skills, specialties]
    )
}

export function useSkillPoints(character: Character) {
    return useMemo(() => {
        const skillSum =
            Object.values(character.skills).reduce((total, value) => total + value, 0) -
            character.specialties.length * 2;
        const skilledBonus = perkRank(character, 'perkSkilled') * 2;
        return 9 + character.special.intelligence + (character.level - 1) + skilledBonus - skillSum;
    }, [
        character.skills,
        character.specialties.length,
        character.perks,
        character.special.intelligence,
        character.level,
    ]);
}
