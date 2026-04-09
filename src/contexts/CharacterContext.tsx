import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {
    BODY_PARTS,
    BodyPart,
    Character,
    CharacterItem,
    MR_HANDY_PARTS,
    MrHandyPart,
    RawCharacter,
} from '@/types';
import {getGameDatabase} from "@/hooks/getGameDatabase";
import { SaveSlotManager } from "@/services/SaveSlotManager.ts";
import useCalculatedCharacter, {
    adjustCurrentHp
} from "@/hooks/useCalculatedCharacter";
import { getOriginById, ORIGINS } from '@/services/character/Origin.ts';
import { RawCharacterSchema } from '@/services/character/characterSchemes.ts';

/**
 * Helper function to create Mysterious Stranger character
 */
export const MYSTERIOUS_44_MAGNUM = {
    id: 'weaponFortyFourPistol', // Mysterious Stranger's signature weapon
    quantity: 1,
    equipped: true,
    mods: ['modMarksmanGrip', 'modPowerful'],
}
export const MYSTERIOUS_STRANGER: RawCharacter = RawCharacterSchema.parse({
    name: 'Mysterious Stranger',
    special: {
        agility: 10,
    },
    skills: {
        smallGuns: 6,
    },
    specialties: ['smallGuns'],
    items: [ MYSTERIOUS_44_MAGNUM ],
})

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? U[] : T[P] extends object
            ? DeepPartial<T[P]> : T[P];
};

// React component prop types
export interface CharacterContextValue {
    character: Character;
    rawCharacter: RawCharacter | null;
    updateCharacter: (updates: DeepPartial<RawCharacter>) => void;
    replenishLuck: () => void;
    spendLuck: () => void;
    resetCharacter: () => void;
    switchToSlot: (slotIndex: number) => void;
    activeSlot: number;
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

function CharacterOverrideProvider({ overrideCharacter, parentContext, children}: Readonly<{
    overrideCharacter: Character,
    parentContext: CharacterContextValue,
    children: ReactNode
}>){
    const contextValue = useMemo(() => ({
        ...parentContext,
        character: overrideCharacter
    }), [parentContext, overrideCharacter])

    return (
        <CharacterContext.Provider value={contextValue}>
            {children}
        </CharacterContext.Provider>
    )
}

function CharacterRootProvider({ onReady, children }: Readonly<{
    onReady: (() => void) | undefined,
    children: ReactNode
}>) {

    const [isReady, setIsReady] = useState(false)
    const dataManager = getGameDatabase()

    useEffect(() => {
        SaveSlotManager.migrateLegacyData()
    }, [])

    const [activeSlot, setActiveSlot] = useState(() => SaveSlotManager.getActiveSlot());
    const [rawCharacter, setRawCharacter] = useState(() => {
        let res = SaveSlotManager.load()
        if(!res){
            res = RawCharacterSchema.parse({})
            SaveSlotManager.save(res)
        }
        return res
    });

    const saveAndSetRawCharacter = (data: RawCharacter) => {
        SaveSlotManager.save(data)
        setRawCharacter(data)
    }
    // Switch to a different character slot
    const switchToSlot = useCallback((slotIndex: number) => {
        SaveSlotManager.setActiveSlot(slotIndex)
        setActiveSlot(slotIndex)
        let loadedCharacter = SaveSlotManager.loadFromSlot(slotIndex)
        loadedCharacter ??= RawCharacterSchema.parse({});
        saveAndSetRawCharacter(loadedCharacter)
    }, [])

    // Reset to default character
    const resetCharacter = useCallback(() => {
        const character = RawCharacterSchema.parse({})
        saveAndSetRawCharacter(character)
    }, [])

    const calculatedCharacter = useCalculatedCharacter(rawCharacter)

    useEffect(() => {
        setIsReady(true)
        onReady?.()
    }, [onReady])

    /**
     * Function used to update character state.
     * Also checks for:
     * - SPECIAL stat changes: adjust HP accordingly
     * - LEVEL changes: adjust HP accordingly
     * - ORIGIN changes: add/remove robot parts
     */
    const updateCharacter = useCallback((updates: DeepPartial<RawCharacter>): void => {
        setRawCharacter(prev => {
            let updatedCharacter: RawCharacter = RawCharacterSchema.parse({
                ...prev, ...updates,
                special: {...prev?.special, ...updates.special},
                skills: {...prev?.skills, ...updates.skills},
            })

            // Filter out traits not relevant to origin
            if(updates.traits){
                updatedCharacter.traits = [
                    ...(prev?.traits?.filter(
                        t => !dataManager.traits[t]!.ORIGINS.includes(updatedCharacter.origin),
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
                updatedCharacter.items = updatedCharacter.items.map(item => {
                    const itemData = dataManager.getItem(item.id)
                    if (dataManager.isType(itemData, 'apparel')
                        && item.equipped
                        && filterCategories.includes(itemData.CATEGORY) === include) {
                        return {...item, equipped: false}
                    }
                    return item
                }) || []
            }

            const items = updatedCharacter.items
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

            SaveSlotManager.save(updatedCharacter)
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
    );
}

export function CharacterProvider({ onReady, children, overrideCharacter }:
                                  Readonly<{
                                      onReady?: () => void;
                                      children: React.ReactNode;
                                      overrideCharacter?: Character;
                                  }>) {

    const parentContext = useContext(CharacterContext);

    // If override is provided and we are inside a context, branch to the Override component
    if (overrideCharacter && parentContext) {
        return (
            <CharacterOverrideProvider
                overrideCharacter={overrideCharacter}
                parentContext={parentContext}
            >
                {children}
            </CharacterOverrideProvider>
        );
    }
    return (
        <CharacterRootProvider onReady={onReady}>
            {children}
        </CharacterRootProvider>
    );
}
