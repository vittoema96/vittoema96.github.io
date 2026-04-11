import { RawCharacter } from '@/types';
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';

// Constants
const LEGACY_STORAGE_KEY = 'character_default';

/**
 * CharacterRepository - Pure storage layer
 * Responsibilities:
 * - Save/Load/Delete character data from localStorage
 * - Validate character data structure
 * - Handle legacy data migration
 */
export const CharacterRepository = {
    /**
     * Save character data to localStorage with a given key
     */
    save(key: string, raw: RawCharacter): void {
        const jsonCharacter = JSON.stringify(raw);
        localStorage.setItem(key, jsonCharacter);
    },

    /**
     * Load character data from localStorage with a given key
     */
    load(key: string): RawCharacter | null {
        const saved = localStorage.getItem(key);
        try {
            if (!saved) { return null; }
            return RawCharacterSchema.parse(JSON.parse(saved));
        } catch (error) {
            console.error(`Failed to parse character from key '${key}':`, error);
            return RawCharacterSchema.parse({});
        }
    },

    /**
     * Delete character data from localStorage with a given key
     */
    delete(key: string): void {
        localStorage.removeItem(key);
    },

    /**
     * Check if a key exists in localStorage
     */
    exists(key: string): boolean {
        return localStorage.getItem(key) !== null;
    },

    /**
     * Migrate legacy character data from 'character_default' to a new key
     * Returns the migrated data if successful, null otherwise
     */
    // TODO ideally this has to go when everyone has migrated
    migrateLegacyData(targetKey: string): RawCharacter | null {
        const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!legacyData) {
            return null;
        }

        try {
            const parsed = RawCharacterSchema.parse(JSON.parse(legacyData));

            // Save to the target key
            this.save(targetKey, parsed);

            // Remove legacy key
            localStorage.removeItem(LEGACY_STORAGE_KEY);

            console.log(`Migrated legacy character data to '${targetKey}'`);
            return parsed;
        } catch (error) {
            console.error('Failed to migrate legacy character data:', error);
            return null;
        }
    },
};
