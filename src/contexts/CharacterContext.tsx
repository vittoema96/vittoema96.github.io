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

/**
 * Helper function to convert companion data to Character format
 */
export function companionToCharacter(companion: Character['companion'], baseCharacter: Character): Character {
    // Calculate maxHp based on companion type
    // For eyebot: baseHp=5, baseBody=4
    // Formula: baseHp + (level - 1) + (body - baseBody)
    const baseHp = companion.type === 'eyebot' ? 5 : 10  // Default to 10 for other types
    const baseBody = companion.type === 'eyebot' ? 4 : 5
    const maxHp = baseHp + (baseCharacter.level - 1) + (companion.body - baseBody)

    return {
        ...baseCharacter,
        name: companion.name,
        // Map companion stats to character format
        // Body maps to Strength (primary for guns/melee)
        // Mind maps to Perception (primary for other skills)
        special: {
            strength: companion.body,      // Body → Strength (for guns, melee)
            perception: companion.mind,    // Mind → Perception (for other)
            endurance: companion.body,     // Body affects HP
            charisma: companion.mind,
            intelligence: companion.mind,
            agility: companion.body,       // Body affects initiative
            luck: 0  // Companions don't have luck
        },
        skills: {
            ...baseCharacter.skills,
            meleeWeapons: companion.melee,
            smallGuns: companion.guns,
            bigGuns: companion.guns,
            energyWeapons: companion.guns,
            explosives: companion.other,
            throwing: companion.other,
            unarmed: companion.melee
        },
        currentHp: companion.currentHp,
        maxHp: maxHp,
        currentLuck: 0,  // Companions don't use luck
        maxLuck: 0,
        items: companion.weapons,  // Only weapons for rolling
        specialties: []  // Companions don't have specialties (unless they have perks that grant them)
    }
}

/**
 * Helper function to create Mysterious Stranger character
 */
export function createMysteriousStranger(baseCharacter: Character): Character {
    return {
        ...baseCharacter,
        name: 'Mysterious Stranger',
        special: {
            strength: 6,
            perception: 6,
            endurance: 6,
            charisma: 10,
            intelligence: 6,
            agility: 10,  // High agility for initiative
            luck: 10  // Max luck
        },
        skills: {
            ...baseCharacter.skills,
            smallGuns: 6,  // Max skill
            bigGuns: 6,
            energyWeapons: 6,
            meleeWeapons: 6,
            unarmed: 6
        },
        currentLuck: 10,
        maxLuck: 10,
        items: [{
            id: 'weapon44Magnum',  // Mysterious Stranger's signature weapon
            quantity: 1,
            equipped: true,
            mods: []
        }]
    }
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


export function CharacterProvider({ onReady, children, overrideCharacter }:
                                  Readonly<{
                                      onReady?: () => void;
                                      children: React.ReactNode;
                                      overrideCharacter?: Character;
                                  }>) {
    const [isReady, setIsReady] = useState(false)

    // If this is a nested provider with overrideCharacter, use parent context for data management
    const parentContext = useContext(CharacterContext)

    // If overrideCharacter is provided, this is a nested provider
    if (overrideCharacter && parentContext) {
        // Return a modified context with the override character
        return (
            <CharacterContext.Provider value={{
                ...parentContext,
                character: overrideCharacter
            }}>
                {children}
            </CharacterContext.Provider>
        )
    }

    // Otherwise, this is the root provider - normal behavior
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
        onReady?.()
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
            if(updates.traits){
                updatedCharacter.traits = [
                    ...(prev?.traits?.filter(
                        t => !dataManager.traits[t].ORIGINS.includes(updatedCharacter.origin),
                    ) ?? []),
                    ...(updates.traits ?? []),
                ];
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
        updateCharacter({ currentLuck: calculatedCharacter.maxLuck })
    }, [calculatedCharacter.maxLuck, updateCharacter])

    /**
     * Spend luck point (decrease current luck by 1)
     */
    const spendLuck = useCallback(() => {
        updateCharacter({ currentLuck: Math.max(0, calculatedCharacter.currentLuck - 1) })
    }, [calculatedCharacter.currentLuck, updateCharacter])










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
        [rawCharacter, calculatedCharacter, updateCharacter, replenishLuck, spendLuck, resetCharacter, downloadCharacter, uploadCharacter]
    )

    return (
        <CharacterContext.Provider value={contextValue}>
            {isReady ? children : null}
        </CharacterContext.Provider>
    )
}
