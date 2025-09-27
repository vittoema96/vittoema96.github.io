import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DEFAULT_CHARACTER } from '../js/constants.js'

const CharacterContext = createContext()

export const useCharacter = () => {
    const context = useContext(CharacterContext)
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider')
    }
    return context
}

export function CharacterProvider({ children }) {
    const STORAGE_KEY = 'character_default'

    const [character, setCharacterState] = useState(DEFAULT_CHARACTER)
    const [isLoading, setIsLoading] = useState(true)

    // Load character on startup
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsedCharacter = JSON.parse(saved)
                // Merge with defaults to handle new properties in updates
                const mergedCharacter = { ...DEFAULT_CHARACTER, ...parsedCharacter }
                setCharacterState(mergedCharacter)
            }
        } catch (error) {
            console.error('Failed to load character:', error)
            // Keep default character on error
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Auto-save on every change
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(character))
            } catch (error) {
                console.error('Failed to save character:', error)
            }
        }
    }, [character, isLoading])

    // Update character (replaces your characterData.property = value)
    const updateCharacter = useCallback((updates) => {
        setCharacterState(prev => ({ ...prev, ...updates }))
    }, [])

    // Reset to default character
    const resetCharacter = useCallback(() => {
        setCharacterState({ ...DEFAULT_CHARACTER })
    }, [])

    // Download character as JSON
    const downloadCharacter = useCallback(() => {
        const dataStr = JSON.stringify(character, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `character_${character.name || 'unnamed'}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }, [character])

    // Upload character from JSON
    const uploadCharacter = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const uploadedCharacter = JSON.parse(e.target.result)

                    // Basic validation
                    if (!uploadedCharacter || typeof uploadedCharacter !== 'object') {
                        throw new Error('Invalid character file format')
                    }

                    // Merge with defaults to ensure all properties exist
                    const validatedCharacter = { ...DEFAULT_CHARACTER, ...uploadedCharacter }
                    setCharacterState(validatedCharacter)
                    resolve(validatedCharacter)
                } catch (error) {
                    reject(new Error(`Failed to parse character file: ${error.message}`))
                }
            }

            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        })
    }, [])

    const contextValue = {
        character,
        updateCharacter,
        resetCharacter,
        downloadCharacter,
        uploadCharacter,
        isLoading
    }

    return (
        <CharacterContext.Provider value={contextValue}>
            {children}
        </CharacterContext.Provider>
    )
}
