import type {RawCharacter, SkillType, SpecialType} from "@/types";
import {SKILLS, SPECIAL} from "@/types";
import { ORIGINS } from '@/utils/characterSheet.ts';

// Constants
const LEGACY_STORAGE_KEY = 'character_default'

/**
 * Comprehensive type guard to validate RawCharacter data structure
 * All fields are optional, but if present must have correct type and structure
 */
function validateCharacterData(data: unknown): data is RawCharacter {
    // Basic type check
    if (!data || typeof data !== 'object') {
        console.warn('Character data is not an object');
        return false;
    }

    const obj = data as any;

    // Validate primitive fields (if present)
    if (obj.name !== undefined && typeof obj.name !== 'string') {
        console.warn('Invalid name field');
        return false;
    }

    if (obj.background !== undefined && typeof obj.background !== 'string') {
        console.warn('Invalid background field');
        return false;
    }

    if (obj.level !== undefined && typeof obj.level !== 'number') {
        console.warn('Invalid level field');
        return false;
    }

    if (obj.caps !== undefined && typeof obj.caps !== 'number') {
        console.warn('Invalid caps field');
        return false;
    }

    if (obj.currentLuck !== undefined && typeof obj.currentLuck !== 'number') {
        console.warn('Invalid currentLuck field');
        return false;
    }

    if (obj.currentHp !== undefined && typeof obj.currentHp !== 'number') {
        console.warn('Invalid currentHp field');
        return false;
    }

    // Validate origin (if present)
    if (obj.origin !== undefined) {
        if (typeof obj.origin !== 'string' || !Object.values(ORIGINS).map(o => o.id).includes(obj.origin)) {
            console.warn('Invalid origin field:', obj.origin);
            return false;
        }
    }

    // Validate special object (if present)
    if (obj.special !== undefined) {
        if (typeof obj.special !== 'object' || obj.special === null || Array.isArray(obj.special)) {
            console.warn('Invalid special field - must be an object');
            return false;
        }

        // Check that all keys are valid SPECIAL stats and values are numbers
        for (const key in obj.special) {
            if (!SPECIAL.includes(key as SpecialType)) {
                console.warn('Invalid SPECIAL stat:', key);
                return false;
            }
            if (typeof obj.special[key] !== 'number') {
                console.warn('Invalid SPECIAL value for', key);
                return false;
            }
        }
    }

    // Validate skills object (if present)
    if (obj.skills !== undefined) {
        if (typeof obj.skills !== 'object' || obj.skills === null || Array.isArray(obj.skills)) {
            console.warn('Invalid skills field - must be an object');
            return false;
        }

        // Check that all keys are valid skills and values are numbers
        for (const key in obj.skills) {
            if (!SKILLS.includes(key as SkillType)) {
                console.warn('Invalid skill:', key);
                return false;
            }
            if (typeof obj.skills[key] !== 'number') {
                console.warn('Invalid skill value for', key);
                return false;
            }
        }
    }

    // Validate specialties array (if present)
    if (obj.specialties !== undefined) {
        if (!Array.isArray(obj.specialties)) {
            console.warn('Invalid specialties field - must be an array');
            return false;
        }

        // Check that all specialties are valid skill IDs
        for (const specialty of obj.specialties) {
            if (typeof specialty !== 'string' || !SKILLS.includes(specialty as SkillType)) {
                console.warn('Invalid specialty:', specialty);
                return false;
            }
        }
    }

    // Validate items array (if present)
    if (obj.items !== undefined) {
        if (!Array.isArray(obj.items)) {
            console.warn('Invalid items field - must be an array');
            return false;
        }

        // Validate each item in the array
        for (let i = 0; i < obj.items.length; i++) {
            const item = obj.items[i];

            if (!item || typeof item !== 'object') {
                console.warn('Invalid item at index', i);
                return false;
            }

            // Required fields
            if (typeof item.id !== 'string') {
                console.warn('Invalid item.id at index', i);
                return false;
            }

            if (typeof item.quantity !== 'number') {
                console.warn('Invalid item.quantity at index', i);
                return false;
            }

            if (!Array.isArray(item.mods)) {
                console.warn('Invalid item.mods at index', i, '- must be an array');
                return false;
            }

            // Check all mods are strings
            for (const mod of item.mods) {
                if (typeof mod !== 'string') {
                    console.warn('Invalid mod in item.mods at index', i);
                    return false;
                }
            }

            // Optional fields
            if (item.variation !== undefined) {
                if (item.variation !== 'left' && item.variation !== 'right') {
                    console.warn('Invalid item.variation at index', i);
                    return false;
                }
            }

            if (item.equipped !== undefined && typeof item.equipped !== 'boolean') {
                console.warn('Invalid item.equipped at index', i);
                return false;
            }
        }
    }

    // Validate customItems array (if present)
    if (obj.customItems !== undefined) {
        if (!Array.isArray(obj.customItems)) {
            console.warn('Invalid customItems field - must be an array');
            return false;
        }

        // Validate each custom item in the array
        for (let i = 0; i < obj.customItems.length; i++) {
            const customItem = obj.customItems[i];

            if (!customItem || typeof customItem !== 'object') {
                console.warn('Invalid customItem at index', i);
                return false;
            }

            // Required fields
            if (typeof customItem.name !== 'string') {
                console.warn('Invalid customItem.name at index', i);
                return false;
            }

            if (typeof customItem.quantity !== 'number') {
                console.warn('Invalid customItem.quantity at index', i);
                return false;
            }

            if (typeof customItem.value !== 'number') {
                console.warn('Invalid customItem.value at index', i);
                return false;
            }

            if (typeof customItem.weight !== 'number') {
                console.warn('Invalid customItem.weight at index', i);
                return false;
            }

            if (typeof customItem.rarity !== 'number') {
                console.warn('Invalid customItem.rarity at index', i);
                return false;
            }

            if (typeof customItem.type !== 'string') {
                console.warn('Invalid customItem.type at index', i);
                return false;
            }

            if (typeof customItem.category !== 'string') {
                console.warn('Invalid customItem.category at index', i);
                return false;
            }

            // Optional fields
            if (customItem.description !== undefined && typeof customItem.description !== 'string') {
                console.warn('Invalid customItem.description at index', i);
                return false;
            }
        }
    }

    return true;
}

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
        const jsonCharacter = JSON.stringify(raw)
        localStorage.setItem(key, jsonCharacter)
    },

    /**
     * Load character data from localStorage with a given key
     */
    load(key: string): RawCharacter | null {
        const saved = localStorage.getItem(key)
        if (!saved) { return null }

        try {
            const parsed = JSON.parse(saved)

            // Validate the parsed data
            if (!validateCharacterData(parsed)) {
                console.warn(`Invalid character data for key '${key}', archiving...`)
                localStorage.setItem(`archived_${key}`, saved)
                this.delete(key)
                return null
            }

            return parsed
        } catch (error) {
            console.error(`Failed to parse character from key '${key}':`, error)
            this.delete(key)
            return null
        }
    },

    /**
     * Delete character data from localStorage with a given key
     */
    delete(key: string): void {
        localStorage.removeItem(key)
    },

    /**
     * Check if a key exists in localStorage
     */
    exists(key: string): boolean {
        return localStorage.getItem(key) !== null
    },

    /**
     * Migrate legacy character data from 'character_default' to a new key
     * Returns the migrated data if successful, null otherwise
     */
    migrateLegacyData(targetKey: string): RawCharacter | null {
        const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY)
        if (!legacyData) { return null }

        try {
            const parsed = JSON.parse(legacyData)

            // Validate the legacy data
            if (!validateCharacterData(parsed)) {
                console.warn('Invalid legacy character data, skipping migration')
                localStorage.removeItem(LEGACY_STORAGE_KEY)
                return null
            }

            // Save to the target key
            this.save(targetKey, parsed)

            // Remove legacy key
            localStorage.removeItem(LEGACY_STORAGE_KEY)

            console.log(`Migrated legacy character data to '${targetKey}'`)
            return parsed
        } catch (error) {
            console.error('Failed to migrate legacy character data:', error)
            localStorage.removeItem(LEGACY_STORAGE_KEY)
            return null
        }
    }
}
