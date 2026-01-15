import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {BODY_PARTS, CharacterContextValue, CharacterItem, MR_HANDY_PARTS, MrHandyPart, RawCharacter} from '@/types'
import {getOriginById} from "@/utils/characterSheet.ts";
import {useGameDatabase} from "@/hooks/useGameDatabase.ts";
import { CharacterRepository } from "@/services/CharacterRepository.ts";
import useCalculatedCharacter, {
    adjustCurrentHp,
    unequipIrrelevantApparel
} from "@/hooks/useCalculatedCharacter.ts";

const CharacterContext = createContext<CharacterContextValue | undefined>(undefined)


// Default plating mod for robot parts (slot 0)
const DEFAULT_PLATING_MOD = 'modRobotPlatingStandard'


/**
 * Custom hook for accessing character context
 */
export const useCharacter = (): CharacterContextValue => {
    const context = useContext(CharacterContext)
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider')
    }
    return context
}


export function CharacterProvider({ onReady, children}:
                                  Readonly<{ onReady: () => void; children: React.ReactNode }>) {
    const [isReady, setIsReady] = useState(false)


    // Lazy load character
    const [rawCharacter, setRawCharacter] = useState(() => CharacterRepository.load())

    // Auto-save on every change
    useEffect(() => {
        if(rawCharacter) CharacterRepository.save(rawCharacter);
        else CharacterRepository.clear()
    }, [rawCharacter])

    // Reset to default character
    const resetCharacter = useCallback(() => {
        setRawCharacter(null)
    }, [])

    const calculatedCharacter = useCalculatedCharacter(rawCharacter)


    useEffect(() => {
        setIsReady(true)
        onReady()
    }, [])

    // Load all csv data
    const dataManager = useGameDatabase()

    /**
     * Function used to update character state.
     * Also checks for:
     * - SPECIAL stat changes: adjust HP accordingly
     * - LEVEL changes: adjust HP accordingly
     * - ORIGIN changes: add/remove robot parts
     */
    const updateCharacter = useCallback((updates: RawCharacter): void => {
        setRawCharacter(prev => {
            let updatedCharacter: RawCharacter = {
                ...prev, ...updates,
                special: {...prev?.special, ...updates.special},
                skills: {...prev?.skills, ...updates.skills},
                specialties: updates.specialties ?? prev?.specialties,
                items: updates.items ?? prev?.items ?? [],
            }
            const recalculateCurrentHp = updates.special?.endurance ||
                                                         updates.special?.luck ||
                                                         updates.level !== undefined
            if (recalculateCurrentHp) {
                updatedCharacter = adjustCurrentHp(prev, updatedCharacter)
            }

            // If origin changed from or to one that needs SpecializedArmor, unequip all apparel
            // This needs to be done BEFORE adding/removing robot parts (otherwise after adding them they would be unequipped)
            const changedOrigin = prev?.origin !== updatedCharacter.origin
            const currentOrigin = getOriginById(updatedCharacter.origin)
            const hasToUnequip = getOriginById(prev?.origin).needsSpecializedArmor ||
                                          currentOrigin.needsSpecializedArmor
            if(changedOrigin && hasToUnequip) {
                updatedCharacter = unequipIrrelevantApparel(dataManager, updatedCharacter)
            }

            const items = updatedCharacter.items ?? []
            // Add or remove robot parts based on origin
            const isRobot = currentOrigin.bodyParts !== BODY_PARTS
            // TODO Only mrHandy parts checked currently
            const hasRobotParts = items.some(i => currentOrigin.bodyParts.has(i.id as MrHandyPart))
            if (isRobot && !hasRobotParts) {
                const newParts: CharacterItem[] =
                    Array.from(currentOrigin.bodyParts, (id) => ({
                        id,
                        quantity: 1,
                        equipped: true,
                        mods: [DEFAULT_PLATING_MOD]
                    }))
                updatedCharacter.items = [...items, ...newParts]
            } else if (!isRobot && hasRobotParts) {
                // TODO Only mrHandy parts checked currently
                updatedCharacter.items = items.filter(i => MR_HANDY_PARTS.has(i.id as MrHandyPart))
            }

            return updatedCharacter
        })
    }, [])









    /**
     * Replenish current luck to max ("luck" value)
     */
    const replenishLuck = useCallback(() => {
        updateCharacter({ currentLuck: calculatedCharacter.special.luck })
    }, [calculatedCharacter.special.luck])

    /**
     * Spend luck point (decrease current luck by 1)
     */
    const spendLuck = useCallback(() => {
        updateCharacter({ currentLuck: Math.max(0, calculatedCharacter.currentLuck - 1) })
    }, [])










    /**
     * Utility method to download character as JSON
     */
    const downloadCharacter = useCallback(() => {
        const dataStr = JSON.stringify(rawCharacter, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `character_${rawCharacter?.name || 'unnamed'}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }, [rawCharacter])


    /**
     * Utility method to upload character from JSON.
     */
    const uploadCharacter = useCallback(
        async (file: Blob): Promise<RawCharacter> => {
            try {
                const text = await file.text()
                const rawData = JSON.parse(text)
                setRawCharacter(rawData)
                return rawData
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)
                throw new Error(`Failed to parse character file: ${errorMessage}`)
            }
        }, []
    )

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            rawCharacter,
            character: calculatedCharacter,
            updateCharacter,
            replenishLuck,
            spendLuck,
            resetCharacter,
            downloadCharacter,
            uploadCharacter
        }),
        [rawCharacter, calculatedCharacter]
        // TODO do we need updateCharacter, resetCharacter, downloadCharacter, uploadCharacter??
    )

    return (
        <CharacterContext.Provider value={contextValue}>
            {isReady ? children : null}
        </CharacterContext.Provider>
    )
}
