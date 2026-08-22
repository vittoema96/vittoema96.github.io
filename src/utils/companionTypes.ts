import { CharacterItem, CompanionId } from '@/types';
import { CompanionSkillType } from '@/features/character/skills/skills.ts';
import { CompanionSpecialType } from '@/features/character/special/special.companion.ts';
import { defaultEyebot } from '@/features/character/feats/perks/implementations/perkRobotWrangler.ts';
import { defaultDog } from '@/features/character/feats/perks/implementations/perkDogmeat.ts';

/**
 * Companion type definition with base stats and configuration
 * Structure mirrors Character but with companion-specific stat names
 */
export interface CompanionTypeDefinition {
    type: CompanionId
    // Base SPECIAL (body/mind)
    special: Record<CompanionSpecialType, number>
    // Base skills (melee/guns/other)
    skills: Record<CompanionSkillType, number>
    // Derived stats
    maxHp: number
    defense: number
    // Damage Reduction by type
    dr: {
        physical: number
        energy: number
        radiation: number
        poison: number
    }
    // Default weapons
    items: (CharacterItem & {skill: CompanionSkillType})[];
}

export interface CompanionData extends CompanionTypeDefinition {
    name?: string | undefined;
    // Current HP
    currentHp: number;
    // Perks
    perks: string[];
}

/**
 * All companion type definitions
 */
export const COMPANION_TYPES: Record<CompanionId, CompanionTypeDefinition> = {
    eyebot: defaultEyebot,
    dog: defaultDog,
    // TODO move these definitions in their respective perk*.ts file
    mrHandy: {
        type: 'mrHandy',
        special: {
            body: 5,
            mind: 5
        },
        skills: {
            melee: 2,
            guns: 2,
            other: 2
        },
        maxHp: 10,
        defense: 2,
        dr: {
            physical: 3,
            energy: 3,
            radiation: Infinity,
            poison: Infinity
        },
        items: []
    },
    humanoid: {
        type: 'humanoid',
        special: {
            body: 5,
            mind: 5
        },
        skills: {
            melee: 3,
            guns: 3,
            other: 2
        },
        maxHp: 10,
        defense: 2,
        dr: {
            physical: 0,
            energy: 0,
            radiation: 0,
            poison: 0
        },
        items: []
    }
}

/**
 * Create a default companion data object from a companion type
 */
export function createDefaultCompanion(companionId: CompanionId): CompanionData {
    const data = COMPANION_TYPES[companionId]
    return {
        ...data,
        currentHp: data.maxHp,
        perks: [],
    }
}

