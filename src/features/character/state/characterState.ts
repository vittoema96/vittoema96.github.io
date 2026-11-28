import type { CompanionId, RawCharacter } from '@/types';
import type { CompanionData } from '@/utils/companionTypes.ts';
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';
import { adjustCurrentHp } from '../calculations/hp.ts';
import { reconcileItems } from '../inventory/inventory.ts';
import { calculateCharacter } from '../calculations/characterCalculations.ts';
import { migrateRawSave } from './saveMigrations.ts';

export type CharacterUpdate = Partial<Omit<RawCharacter, 'special' | 'skills'>> & {
    special?: Partial<RawCharacter['special']>;
    skills?: Partial<RawCharacter['skills']>;
};

type CompanionUpdate = Partial<Omit<CompanionData, 'type'>>;

export function updateCompanion(
    id: CompanionId,
    updates: CompanionUpdate | ((companion: CompanionData) => CompanionUpdate),
): (prev: RawCharacter) => CharacterUpdate {
    return prev => {
        // Newly unlocked companions have derived defaults until their first saved edit.
        const companion = prev.companions[id] ?? calculateCharacter(prev).companion;
        if (!companion || companion.type !== id) {
            throw new Error(`Cannot update missing companion: ${id}`);
        }
        const patch = typeof updates === 'function' ? updates(companion) : updates;
        return { companions: { [id]: { ...companion, ...patch } } };
    };
}

/** Validates and migrates a stored or imported save. Never heals. */
export function loadCharacter(input: unknown): RawCharacter {
    return reconcileItems(RawCharacterSchema.parse(migrateRawSave(input)));
}

export function applyUpdate(prev: RawCharacter, updates: CharacterUpdate): RawCharacter {
    const next = RawCharacterSchema.parse({
        ...prev,
        ...updates,
        special: { ...prev.special, ...updates.special },
        skills: { ...prev.skills, ...updates.skills },
        companions: { ...prev.companions, ...updates.companions },
    });

    // Let's do it always, as various things can edit current and max hp (perkLifeGiver for example)
    const adjusted = adjustCurrentHp(prev, next, 'currentHp' in updates);
    return reconcileItems(adjusted);
}
