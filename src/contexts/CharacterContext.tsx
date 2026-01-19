import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {
    BODY_PARTS,
    BodyPart,
    Character,
    CharacterItem,
    MR_HANDY_PARTS,
    MrHandyPart,
    RawCharacter,
} from '@/types';
import { getOriginById, ORIGINS } from '@/utils/characterSheet';
import {getGameDatabase} from "@/hooks/getGameDatabase";
import { CharacterRepository } from "@/services/CharacterRepository";
import useCalculatedCharacter, {
    adjustCurrentHp
} from "@/hooks/useCalculatedCharacter";


// React component prop types
export interface CharacterContextValue {
    character: Character;
    rawCharacter: RawCharacter | null;
    updateCharacter: (updates: RawCharacter) => void;
    replenishLuck: () => void;
    spendLuck: () => void;
    resetCharacter: () => void;
    downloadCharacter: () => void;
    uploadCharacter: (file: Blob) => Promise<RawCharacter>;
}
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
        if(rawCharacter) { CharacterRepository.save(rawCharacter) }
        else { CharacterRepository.clear() }
    }, [rawCharacter])

    // Reset to default character
    const resetCharacter = useCallback(() => {
        setRawCharacter(null)
    }, [])

    const calculatedCharacter = useCalculatedCharacter(rawCharacter)


    useEffect(() => {
        setIsReady(true)
        onReady()
    }, [onReady])

    // Load all csv data
    const dataManager = getGameDatabase()

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

            // TODO this is better but we need a more robust implementation
            //  currently supermutant is not handled
            const hasToUnequip = getOriginById(prev?.origin).needsSpecializedArmor ||
                                          currentOrigin.needsSpecializedArmor
            if(changedOrigin && hasToUnequip) {
                let filterCategories = ['robotPart', 'superMutantArmor']
                let include = true
                if(currentOrigin.isRobot){
                    include = false
                    filterCategories = ['robotPart']
                }
                if(currentOrigin === ORIGINS.SUPER_MUTANT){
                    include = false
                    filterCategories = ['superMutantArmor'] // TODO add this category
                }
                updatedCharacter.items = updatedCharacter.items?.map(item => {
                    const itemData = dataManager.getItem(item.id)
                    if (dataManager.isType(itemData, 'apparel')
                        && item.equipped
                        && filterCategories.includes(itemData.CATEGORY) === include) {
                        return {...item, equipped: false}
                    }
                    return item
                }) || []
            }

            const items = updatedCharacter.items ?? []
            // TODO Only mrHandy parts checked currently
            const hasRobotParts = items.some(i => currentOrigin.bodyParts.has(i.id as MrHandyPart))
            if (currentOrigin.isRobot) {
                let newParts: CharacterItem[] = []
                if (hasRobotParts) {
                    items.forEach(item => {
                        if (currentOrigin.bodyParts.has(item.id as MrHandyPart)) {
                            item.equipped = true;
                        }
                    });
                } else {
                    newParts = Array.from(currentOrigin.bodyParts, id => ({
                        id,
                        quantity: 1,
                        equipped: true,
                        mods: [DEFAULT_PLATING_MOD],
                    }));
                }
                updatedCharacter.items = [...items, ...newParts]
            } else if (hasRobotParts) {
                // TODO Only mrHandy and Protectron parts checked currently
                // TODO CRITICAL ITEMS GET REMOVE (LOOSING MODS IF ACCIDENTALLY SWAPPING ORIGIN)
                updatedCharacter.items = items.filter(i => MR_HANDY_PARTS.has(i.id as MrHandyPart) || BODY_PARTS.has(i.id as BodyPart))
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
