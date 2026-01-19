import type {RawCharacter} from "@/types";

// Constants
const STORAGE_KEY = 'character_default'


export const CharacterRepository = {
    /**
     * Save character to localStorage
     */
    save(raw: RawCharacter): void {
        const jsonCharacter = JSON.stringify(raw)
        localStorage.setItem(STORAGE_KEY, jsonCharacter)
    },

    /**
     * Load character from localStorage
     */
    load(): RawCharacter | null {

        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) { return null }

        try {
            return JSON.parse(saved) as RawCharacter
        } catch (error) {
            console.error('Failed to parse saved character:', error)
            return null
        }
    },

    clear(): void {
        localStorage.removeItem(STORAGE_KEY)
    }
}
