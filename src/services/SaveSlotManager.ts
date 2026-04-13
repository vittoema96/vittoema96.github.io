import { RawCharacter } from '@/types';
import { CharacterRepository } from './character/CharacterRepository.ts';

// Constants
const STORAGE_KEY_PREFIX = 'character_slot_';
const ACTIVE_SLOT_KEY = 'character_active_slot';
export const MAX_SLOTS = 10;

export interface CharacterSlotInfo {
    slotIndex: number;
    name: string;
    level: number;
    origin?: string | undefined;
}

/**
 * CharacterSlotManager - Slot management layer
 * Responsibilities:
 * - Manage character slots (0-9)
 * - Track active slot
 * - Provide slot metadata
 */
export const SaveSlotManager = {
    /**
     * Get the storage key for a specific slot
     */
    getSlotKey(slotIndex: number): string {
        return `${STORAGE_KEY_PREFIX}${slotIndex}`;
    },

    /**
     * Get the active character slot index (0-9)
     */
    getActiveSlot(): number {
        const saved = localStorage.getItem(ACTIVE_SLOT_KEY);
        if (!saved) { return 0; }
        const slot = Number.parseInt(saved, 10);
        return (slot >= 0 && slot < MAX_SLOTS) ? slot : 0;
    },

    /**
     * Set the active character slot index (0-9)
     */
    setActiveSlot(slotIndex: number): void {
        if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
            console.warn('Invalid slot index:', slotIndex);
            return;
        }
        localStorage.setItem(ACTIVE_SLOT_KEY, slotIndex.toString());
    },

    /**
     * Save character to a specific slot
     */
    saveToSlot(slotIndex: number, raw: RawCharacter): void {
        if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
            console.warn('Invalid slot index:', slotIndex);
            return;
        }
        const key = this.getSlotKey(slotIndex);
        CharacterRepository.save(key, raw);
    },

    /**
     * Load character from a specific slot
     */
    loadFromSlot(slotIndex: number): RawCharacter | null {
        if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
            console.warn('Invalid slot index:', slotIndex);
            console.warn('Defaulting to slot 0');
            slotIndex = 0;
        }
        const key = this.getSlotKey(slotIndex);
        return CharacterRepository.load(key);
    },

    /**
     * Delete character from a specific slot
     */
    clearSlot(slotIndex: number): void {
        if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
            console.warn('Invalid slot index:', slotIndex);
            return;
        }
        const key = this.getSlotKey(slotIndex);
        CharacterRepository.delete(key);
    },

    /**
     * Get info about all character slots
     */
    getAllSlots(): (CharacterSlotInfo | null)[] {
        const slots: (CharacterSlotInfo | null)[] = [];
        for (let i = 0; i < MAX_SLOTS; i++) {
            const character = this.loadFromSlot(i);
            if (character) {
                slots.push({
                    slotIndex: i,
                    name: character.name ?? 'Unnamed', // TODO translate Unnamed
                    level: character.level,
                    origin: character.origin
                });
            } else {
                slots.push(null);
            }
        }
        return slots;
    },

    /**
     * Save character to the active slot
     */
    save(raw: RawCharacter): void {
        const activeSlot = this.getActiveSlot();
        this.saveToSlot(activeSlot, raw);
    },

    /**
     * Load character from the active slot
     */
    load(): RawCharacter | null {
        const activeSlot = this.getActiveSlot();
        return this.loadFromSlot(activeSlot);
    },

    /**
     * Clear the active slot
     */
    clear(): void {
        const activeSlot = this.getActiveSlot();
        this.clearSlot(activeSlot);
    },

    /**
     * Migrate legacy data to first available slot
     */
    // TODO ideally this has to go when everyone has migrated
    migrateLegacyData(): void {
        // Find first available slot (prefer slot 0)
        let targetSlot = 0;
        for (let i = 0; i < MAX_SLOTS; i++) {
            const key = this.getSlotKey(i);
            if (!CharacterRepository.exists(key)) {
                targetSlot = i;
                break;
            }
        }

        const targetKey = this.getSlotKey(targetSlot);
        const migratedData = CharacterRepository.migrateLegacyData(targetKey);

        if (migratedData) {
            // Set as active slot if no active slot is set
            const activeSlot = localStorage.getItem(ACTIVE_SLOT_KEY);
            if (!activeSlot) {
                this.setActiveSlot(targetSlot);
            }
        }
    }
};

