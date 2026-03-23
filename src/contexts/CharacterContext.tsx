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
import { CharacterSlotManager } from "@/services/CharacterSlotManager";
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
    switchToSlot: (slotIndex: number) => void;
    activeSlot: number;
}

/**
 * Helper function to convert companion data to Character format
 * With the new structure, companion already has special/skills like Character,
 * so we just need to map the companion data to Character interface
 */
export function companionToCharacter(companion: Character['companion'], baseCharacter: Character): Character {
    return {
        ...baseCharacter,
        name: companion.name,
        // Companion already has special with body/mind keys
        special: companion.special as any,
        // Companion already has skills with melee/guns/other keys
        skills: companion.skills as any,
        currentHp: companion.currentHp,
        // maxHp, maxLuck, etc. are calculated in useCalculatedCharacter
        currentLuck: 0,
        items: companion.weapons,
        perks: companion.perks.filter((p): p is string => p !== undefined),
        specialties: []
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
    // Migrate legacy data if present (runs once on first load)
    CharacterSlotManager.migrateLegacyData()

    // Track active slot
    const [activeSlot, setActiveSlot] = useState(() => CharacterSlotManager.getActiveSlot())

    // Lazy load character from active slot
    const [rawCharacter, setRawCharacter] = useState(() => CharacterSlotManager.load())

    // Auto-save on every change
    useEffect(() => {
        if(rawCharacter) { CharacterSlotManager.save(rawCharacter) }
        else { CharacterSlotManager.clear() }
    }, [rawCharacter])

    // Switch to a different character slot
    const switchToSlot = useCallback((slotIndex: number) => {
        CharacterSlotManager.setActiveSlot(slotIndex)
        setActiveSlot(slotIndex)
        const loadedCharacter = CharacterSlotManager.loadFromSlot(slotIndex)
        setRawCharacter(loadedCharacter)
    }, [])

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


    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            rawCharacter,
            character: calculatedCharacter,
            updateCharacter,
            replenishLuck,
            spendLuck,
            resetCharacter,
            switchToSlot,
            activeSlot
        }),
        [rawCharacter, calculatedCharacter, updateCharacter, replenishLuck, spendLuck, resetCharacter, switchToSlot, activeSlot]
    )

    return (
        <CharacterContext.Provider value={contextValue}>
            {isReady ? children : null}
        </CharacterContext.Provider>
    )
}
