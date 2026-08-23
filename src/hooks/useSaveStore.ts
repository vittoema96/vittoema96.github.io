import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';
import { RawCharacter } from '@/types';

export const MAX_SLOTS = 10;
const STORAGE_KEY = 'PB3K_character_saves';

// Legacy keys for storage migration
const LEGACY_PREFIX = 'character_slot_';
const LEGACY_ACTIVE_KEY = 'character_active_slot';

export const getDefaultCharacter = (): RawCharacter => RawCharacterSchema.parse({});

/**
 * Migration function: executed once on app startup.
 * If legacy save keys exist and the unified Zustand key does not,
 * it migrates all individual legacy slots into the Zustand> structure.
 */
export function migrateLegacyStorage(): void {
    // If the new storage key already exists, migration was previously completed
    if (localStorage.getItem(STORAGE_KEY)) {
        return;
    }

    // 1. Read legacy active slot index
    const legacyActive = localStorage.getItem(LEGACY_ACTIVE_KEY);
    localStorage.removeItem(LEGACY_ACTIVE_KEY);
    const parsedSlot = legacyActive ? Number.parseInt(legacyActive, 10) : 0;
    const activeSlot = parsedSlot >= 0 && parsedSlot < MAX_SLOTS ? parsedSlot : 0;

    // 2. Read individual legacy slot entries
    let hasFoundAnyLegacyData = false;
    const slots: (RawCharacter | null)[] = Array.from({ length: MAX_SLOTS }, (_, i) => {
        const key = `${LEGACY_PREFIX}${i}`;
        const savedChar = localStorage.getItem(key);
        localStorage.removeItem(key);
        if (!savedChar) { return null; }
        try {
            hasFoundAnyLegacyData = true;
            return RawCharacterSchema.parse(JSON.parse(savedChar));
        } catch { return null; }
    });

    if (!hasFoundAnyLegacyData && !legacyActive) {
        return;
    }

    // Ensure the active slot contains a valid character
    slots[activeSlot] ??= getDefaultCharacter();

    // 3. Persist the unified state structure expected by Zustand Persist middleware
    const migratedState = {
        state: {
            activeSlot,
            slots,
        },
        version: 0,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedState));
}

// TODO Remove after some time... 2026-05-14
migrateLegacyStorage();

// --- Store State & Action Definitions ---

interface SaveStoreState {
    activeSlot: number;
    setActiveSlot: (index: number) => void;

    slots: (RawCharacter | null)[];
    deleteSlot: (index: number) => void;
    importSlot: (index: number, rawData: unknown) => void;

    updateActiveCharacter: (updater: (prev: RawCharacter) => RawCharacter) => void;

    // Actions
    resetActiveCharacter: () => void;
}

export const useSaveStore = create<SaveStoreState>()(
    persist(
        (set) => ({
            activeSlot: 0,
            setActiveSlot: (index) => {
                if (index < 0 || index >= MAX_SLOTS) { return; }
                set((state) => {
                    const nextSlots = [...state.slots];
                    nextSlots[index] ??= getDefaultCharacter();
                    return { activeSlot: index, slots: nextSlots };
                });
            },

            slots: Array.from({ length: MAX_SLOTS }, (_, i) => (i === 0 ? getDefaultCharacter() : null)),

            deleteSlot: (index) => {
                if (index < 0 || index >= MAX_SLOTS) { return; }
                set((state) => {
                    const nextSlots = [...state.slots];
                    nextSlots[index] = null;
                    if (index === state.activeSlot) {
                        nextSlots[index] = getDefaultCharacter();
                    }
                    return { slots: nextSlots };
                });
            },

            importSlot: (index, rawData) => {
                if (index < 0 || index >= MAX_SLOTS) { return; }
                const validated = RawCharacterSchema.parse(rawData);
                set((state) => {
                    const nextSlots = [...state.slots];
                    nextSlots[index] = validated;
                    return { slots: nextSlots };
                });
            },

            updateActiveCharacter: (updater) => {
                set((state) => {
                    const current = state.slots[state.activeSlot] ?? getDefaultCharacter();
                    const updated = updater(current);
                    // Garantisce che anche gli aggiornamenti passino per la validazione/migrazione Zod
                    const validated = RawCharacterSchema.parse(updated);
                    const nextSlots = [...state.slots];
                    nextSlots[state.activeSlot] = validated;
                    return { slots: nextSlots };
                });
            },

            resetActiveCharacter: () => {
                set((state) => {
                    const nextSlots = [...state.slots];
                    nextSlots[state.activeSlot] = getDefaultCharacter();
                    return { slots: nextSlots };
                });
            },
        }),
        {
            name: STORAGE_KEY,
            // Forces Zod parsing on every save on disk
            merge: (persistedState, currentState) => {
                const typedPersisted = persistedState as Partial<SaveStoreState> | undefined;
                if (!typedPersisted || !Array.isArray(typedPersisted.slots)) {
                    return currentState;
                }

                const validatedSlots = typedPersisted.slots.map((slot) => {
                    if (!slot) { return null; }
                    try {
                        // Converte automaticamente vecchi formati (es. companion singolo) nel nuovo formato
                        return RawCharacterSchema.parse(slot);
                    } catch (error) {
                        console.error('Error during parsing of the rehydrated slot:', error);
                        return null;
                    }
                });

                return {
                    ...currentState,
                    ...typedPersisted,
                    slots: validatedSlots,
                };
            },
        }
    )
);

export const useActiveCharacter = (): RawCharacter =>
    useSaveStore((state) => state.slots[state.activeSlot] ?? getDefaultCharacter());
