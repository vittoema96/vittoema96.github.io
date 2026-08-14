import { useCallback, useEffect, useState } from 'react';
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';
import { RawCharacter } from '@/types';


export const MAX_SLOTS = 10;
const STORAGE_KEY_PREFIX = 'character_slot_';
const ACTIVE_SLOT_KEY = 'character_active_slot';


export interface CharacterSlotInfo {
    slotIndex: number;
    name: string;
    level: number;
    origin?: string | undefined;
}


function parseSlot(slotIndex: any): number | undefined {
    const idx = Number(slotIndex);
    if(Number.isInteger(idx) && idx >= 0 && idx < MAX_SLOTS){
        return idx
    }
    return undefined;
}

/** Get the storage key for a specific slot */
function getSlotKey(slotIndex: number): string {
    return `${STORAGE_KEY_PREFIX}${slotIndex}`;
}

/** Get the active character slot index [0 - 9] (0 - MAX_SLOTS-1) */
export function getActiveSlotIndex(): number {
    const saved = parseSlot(localStorage.getItem(ACTIVE_SLOT_KEY));
    return saved || 0;
}

/** Set the active character slot index [0 - 9] (0 - MAX_SLOTS-1) */
export function setActiveSlotIndex(slotIndex: number): void {
    if (parseSlot(slotIndex) === undefined) {
        console.warn(`Invalid slot index: ${slotIndex}. Cannot set active slot.`);
        return;
    }
    localStorage.setItem(ACTIVE_SLOT_KEY, slotIndex.toString());
}

/** Save character to a specific slot */
export function saveToSlot(slotIndex: number, raw: RawCharacter): void {
    if (parseSlot(slotIndex) === undefined) {
        console.warn(`Invalid slot index: ${slotIndex}. Aborting save.`);
        return;
    }
    localStorage.setItem(getSlotKey(slotIndex), JSON.stringify(raw));
}

/**
 * Load character from a specific slot
 */
export function loadFromSlot(slotIndex: number): RawCharacter | undefined | null {

    if (parseSlot(slotIndex) === undefined) {
        console.warn(`Invalid slot index: ${slotIndex}. Aborting load.`);
        return null;
    }
    const saved = localStorage.getItem(getSlotKey(slotIndex));
    if (!saved) { return undefined }
    try {
        return RawCharacterSchema.parse(JSON.parse(saved));
    } catch (error) {
        console.error(`Failed to parse character from slot ${slotIndex}:`, error);
        return null;
    }
}

/** Delete character from a specific slot */
export function clearSlot(slotIndex: number): void {
    if (parseSlot(slotIndex) === undefined) {
        console.warn(`Invalid slot index: ${slotIndex}. Aborting clear.`);
        return;
    }
    localStorage.removeItem(getSlotKey(slotIndex));
}

/**
 * Get info about all character slots
 */
export function getAllSlots(): (CharacterSlotInfo | null | undefined)[] {
    return Array.from({ length: MAX_SLOTS }, (_, i) => {
        const character = loadFromSlot(i);
        if (!character) { return character }
        return {
            slotIndex: i,
            name: character.name ?? 'Unnamed',
            level: character.level,
            origin: character.origin,
        };
    });
}


export const useSaveSlots = () => {
    const [activeSlot, setActiveSlot] = useState(() => {
        let loadedCharacter = null
        let slot = getActiveSlotIndex()-1 // first cycle +1
        let slotCounter = 0
        // Checks activeSlotIndex: if character is invalid try the next available slot,
        // if not present creates a default character
        while(loadedCharacter === null && slotCounter<MAX_SLOTS) {
            slot = (slot + 1) % 10
            slotCounter++
            loadedCharacter = loadFromSlot(slot)
        }
        if(loadedCharacter === null) {
            throw new Error("All save slots contain invalid characterdata. " +
                "Manually delete one from localStorage to allow the app to start.")
        }
        return slot;
    })
    const [rawCharacter, setRawCharacter] = useState(() => {
        let loadedCharacter = loadFromSlot(activeSlot);
        loadedCharacter ??= RawCharacterSchema.parse({});
        return loadedCharacter
    });

    useEffect(() => {
        setActiveSlotIndex(activeSlot);
        saveToSlot(activeSlot, rawCharacter);
    }, [activeSlot, rawCharacter]);

    const switchSlot = (slotIndex: number) => {
        if (parseSlot(slotIndex) === undefined) {
            console.warn(`Invalid slot index: ${slotIndex}. Cannot switch slot.`);
            return;
        }
        let loadedCharacter = loadFromSlot(slotIndex);
        if(loadedCharacter === null) {
            console.warn(`Invalid character data in slot index: ${slotIndex}. Cannot switch slot.`);
            return;
        }
        loadedCharacter ??= RawCharacterSchema.parse({});
        setActiveSlot(slotIndex)
        setRawCharacter(loadedCharacter)
    }

    // Reset to default character
    const resetCharacter = useCallback(() => {
        const character = RawCharacterSchema.parse({})
        setRawCharacter(character)
    }, [])

    return {
        activeSlot, setActiveSlot: switchSlot,
        rawCharacter, setRawCharacter,
        resetCharacter
    }
}
