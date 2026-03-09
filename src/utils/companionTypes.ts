import { CompanionId, CompanionData, CharacterItem, CompanionSpecialType, CompanionSkillType } from '@/types'

/**
 * Mapping from companion skills to companion SPECIAL stats
 * Similar to SKILL_TO_SPECIAL_MAP but for companions
 */
export const COMPANION_SKILL_TO_SPECIAL_MAP: Record<CompanionSkillType, CompanionSpecialType> = {
    melee: 'body',  // Physical melee attacks use body
    guns: 'body',   // Ranged attacks use body for coordination
    other: 'mind'   // Technical/other skills use mind
} as const

/**
 * Companion type definition with base stats and configuration
 * Structure mirrors Character but with companion-specific stat names
 */
export interface CompanionTypeDefinition {
    id: CompanionId
    name: string
    // Base SPECIAL (body/mind)
    special: Record<CompanionSpecialType, number>
    // Base skills (melee/guns/other)
    skills: Record<CompanionSkillType, number>
    // Derived stats
    baseHp: number
    baseDefense: number
    // Damage Reduction by type
    baseDR: {
        physical: number
        energy: number
        radiation: number
        poison: number
    }
    // Default weapons
    weapons: {
        id: string
        customName: string
        skill: CompanionSkillType
    }[]
}

/**
 * All companion type definitions
 */
export const COMPANION_TYPES: Record<CompanionId, CompanionTypeDefinition> = {
    eyebot: {
        id: 'eyebot',
        name: 'Eyebot',
        special: {
            body: 4,
            mind: 4
        },
        skills: {
            melee: 0,
            guns: 3,
            other: 1
        },
        baseHp: 5,
        baseDefense: 2,
        baseDR: {
            physical: 2,
            energy: 2,
            radiation: Infinity, // Immune
            poison: Infinity     // Immune
        },
        weapons: [
            {
                id: 'weaponCompanionLaser',
                customName: 'LASER',
                skill: 'guns'
            }
        ]
    },
    dog: {
        id: 'dog',
        name: 'Dog',
        special: {
            body: 5,
            mind: 3
        },
        skills: {
            melee: 4,
            guns: 0,
            other: 0
        },
        baseHp: 8,
        baseDefense: 3,
        baseDR: {
            physical: 0,
            energy: 0,
            radiation: 0,
            poison: 0
        },
        weapons: []
    },
    mrHandy: {
        id: 'mrHandy',
        name: 'Mr. Handy',
        special: {
            body: 5,
            mind: 5
        },
        skills: {
            melee: 2,
            guns: 2,
            other: 2
        },
        baseHp: 10,
        baseDefense: 2,
        baseDR: {
            physical: 3,
            energy: 3,
            radiation: Infinity,
            poison: Infinity
        },
        weapons: []
    },
    humanoid: {
        id: 'humanoid',
        name: 'Humanoid',
        special: {
            body: 5,
            mind: 5
        },
        skills: {
            melee: 3,
            guns: 3,
            other: 2
        },
        baseHp: 10,
        baseDefense: 2,
        baseDR: {
            physical: 0,
            energy: 0,
            radiation: 0,
            poison: 0
        },
        weapons: []
    }
}

/**
 * Create a default companion data object from a companion type
 */
export function createDefaultCompanion(companionId: CompanionId): CompanionData {
    const type = COMPANION_TYPES[companionId]

    return {
        type: companionId,
        name: type.name,
        special: { ...type.special },
        skills: { ...type.skills },
        currentHp: type.baseHp,
        perks: [],
        weapons: type.weapons.map(w => ({
            id: w.id,
            quantity: 1,
            equipped: false,
            mods: [],
            customName: w.customName
        }))
    }
}

