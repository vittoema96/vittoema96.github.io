import { DEFAULT_CHARACTER, STORAGE_CONFIG } from './constants.js';

export const saveCharacter = (characterId, data) => {
    const storageKey = `${STORAGE_CONFIG.CHARACTER_PREFIX}${characterId}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log(`Character data for '${characterId}' saved.`);
};

export const loadCharacterData = (characterId = STORAGE_CONFIG.DEFAULT_CHARACTER_ID) => {
    const storageKey = `${STORAGE_CONFIG.CHARACTER_PREFIX}${characterId}`;
    const savedDataJSON = localStorage.getItem(storageKey);

    if (savedDataJSON) {
        try {
            const loadedData = JSON.parse(savedDataJSON);
            // Deep merge with defaults to ensure all properties exist
            return {
                ...JSON.parse(JSON.stringify(DEFAULT_CHARACTER)), // Deep copy to avoid mutations
                ...loadedData,
                special: { ...DEFAULT_CHARACTER.special, ...loadedData.special },
                skills: { ...DEFAULT_CHARACTER.skills, ...loadedData.skills },
            };
        } catch (error) {
            console.error('Error parsing saved character data:', error);
            return JSON.parse(JSON.stringify(DEFAULT_CHARACTER));
        }
    }
    return JSON.parse(JSON.stringify(DEFAULT_CHARACTER));
};

// Export character data as JSON string for download
export const exportCharacterToJSON = characterData => JSON.stringify(characterData, null, 2);

// Import character data from JSON string
export const importCharacterFromJSON = jsonString => {
    try {
        const importedData = JSON.parse(jsonString);

        // Validate basic structure
        if (!importedData || typeof importedData !== 'object') {
            throw new Error('Invalid character data format');
        }

        // Merge with defaults to ensure all properties exist
        return {
            ...JSON.parse(JSON.stringify(DEFAULT_CHARACTER)),
            ...importedData,
            special: { ...DEFAULT_CHARACTER.special, ...importedData.special },
            skills: { ...DEFAULT_CHARACTER.skills, ...importedData.skills },
        };
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON format');
        }
        throw error;
    }
};

// Clear all character data from localStorage
export const clearAllCharacterData = () => {
    const keys = Object.keys(localStorage);
    const characterKeys = keys.filter(key => key.startsWith(STORAGE_CONFIG.CHARACTER_PREFIX));

    characterKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${characterKeys.length} character data entries.`);
};
