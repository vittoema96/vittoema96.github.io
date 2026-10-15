import type { CompanionId, RawCharacter } from '@/types';
import type { CompanionData } from '@/utils/companionTypes.ts';
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';
import { adjustCurrentHp } from './hp.ts';
import { reconcileItems } from './items.ts';
import { calculateCharacter } from './calculate.ts';

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

export function loadCharacter(input: unknown): RawCharacter {
    let character = RawCharacterSchema.parse(input);
    // TODO Temporary migration added 2026-10-15: remove when old saves/exports no longer need support.
    if (character.saveVersion === 0) {
        const legacyGrants = new Map([
            ['weaponMrHandyCircularSaw', 'traitMrHandyCircularSaw'],
            ['weaponMrHandyFlamethrower', 'traitMrHandyFlamethrower'],
            ['weaponMrHandyPliers', 'traitMrHandyPliers'],
            ['weaponMrHandyAutomaticPistol', 'traitMrHandyAutomaticPistol'],
            ['weaponMrHandyLaserEmitter', 'traitMrHandyLaserEmitter'],
            ['weaponIronFist', 'perkIronFist'],
        ]);
        character = RawCharacterSchema.parse({
            ...character,
            saveVersion: 1,
            items: character.items.map(item => {
                if (item.grantedBy !== undefined) {
                    return item;
                }
                // Old manual copies are indistinguishable and follow the agreed adoption policy.
                const grantedBy = legacyGrants.get(item.id);
                return grantedBy ? { ...item, grantedBy } : item;
            }),
        });
    }
    return reconcileItems(character, character);
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
    return reconcileItems(prev, adjusted);
}
