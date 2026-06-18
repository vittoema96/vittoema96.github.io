/**
 * CharacterContext — global state for the active player character.
 *
 * Provides:
 * - `rawCharacter`  – the persisted, user-editable data (SPECIAL, skills, items, …)
 * - `character`     – a read-only, fully-calculated view (derived stats, equipped bonuses, …)
 * - `updateCharacter` – partial-update function with side-effects (HP adjust, origin-change logic)
 * - Slot management  – switch / reset character save slots
 * - Luck helpers     – spend / replenish luck points
 *
 * Architecture:
 * - `CharacterRootProvider`     – owns state, persistence (SaveSlotManager) and derived calc
 * - `CharacterOverrideProvider` – lightweight wrapper that swaps `character` (used for companions)
 * - `CharacterProvider`         – public API; auto-selects Root vs Override based on context nesting
 */

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
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';
import { z } from 'zod';

/**
 * Pre-built "Mysterious Stranger" companion character.
 * TODO: Move to a dedicated presets/characters module. maybe we could also define a
 *      "default" character and take defaults from that
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
    maxHp: 9999,
})

/** Shape of the value exposed by CharacterContext to consumers. */
export interface CharacterContextValue {
    character: Character;
    rawCharacter: RawCharacter | null;
    updateCharacter: (updates: z.input<typeof RawCharacterSchema>) => void;
    replenishLuck: () => void;
    spendLuck: () => void;

    resetCharacter: () => void;
    switchToSlot: (slotIndex: number) => void;
    activeSlot: number;
}
const CharacterContext = createContext<CharacterContextValue | undefined>(undefined)


// Default plating mod for robot parts (slot 0)
// TODO this should not be handled here (? or does it?)
const DEFAULT_PLATING_MOD = 'modRobotPlatingStandard'


/** Convenience hook — throws if used outside a `CharacterProvider`. */
export const useCharacter = (): CharacterContextValue => {
    const context = useContext(CharacterContext)
    if (!context) { throw new Error('useCharacter must be used within a CharacterProvider') }
    return context
}

/**
 * Lightweight provider that overrides only `character` while keeping the parent
 * context's updaters intact. Used to render companion stats in the companion tab
 * without affecting the main character state.
 */
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

/**
 * Core provider — owns character state, handles persistence via SaveSlotManager,
 * and computes the derived `Character` via `useCalculatedCharacter`.
 */
function CharacterRootProvider({ children }: Readonly<{
    children: ReactNode
}>) {

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

    // Switch to a different character slot
    const switchToSlot = useCallback((slotIndex: number) => {
        SaveSlotManager.setActiveSlot(slotIndex)
        setActiveSlot(slotIndex)
        let loadedCharacter = SaveSlotManager.loadFromSlot(slotIndex)
        loadedCharacter ??= RawCharacterSchema.parse({});
        SaveSlotManager.save(loadedCharacter)
        setRawCharacter(loadedCharacter)
    }, [])

    // Reset to default character
    const resetCharacter = useCallback(() => {
        const character = RawCharacterSchema.parse({})
        SaveSlotManager.save(character)
        setRawCharacter(character)
    }, [])

    const calculatedCharacter = useCalculatedCharacter(rawCharacter)


    /**
     * Partial-update function for character state.
     *
     * Beyond merging fields, it handles domain side-effects:
     * 1. Merges SPECIAL / skills shallowly
     * 2. Filters traits incompatible with the new origin
     * 3. Adjusts currentHp when maxHp changes
     * 4. Unequips apparel when switching to/from origins with specialized armor
     * 5. Adds/removes robot body parts on origin change
     *
     * WARNING: this function mutates `item.equipped` in-place for robot parts —
     *          a known issue (see audit P0).
     */
    const updateCharacter = useCallback((
        updates: z.input<typeof RawCharacterSchema>
    ): void => {
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

            // Let's do it always, as various things can edit current and max hp (perkLifeGiver for example)
            updatedCharacter = adjustCurrentHp(prev, updatedCharacter)

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
            const hasRobotParts = items.some(i => currentOrigin.bodyParts.has(i.id as MrHandyPart | BodyPart))
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
            {children}
        </CharacterContext.Provider>
    );
}

/**
 * Public entry-point provider.
 *
 * - First mount (no parent context): renders `CharacterRootProvider` with full state.
 * - Nested mount with `overrideCharacter`: renders `CharacterOverrideProvider` to
 *   swap the read-only character while inheriting parent updaters.
 */
export function CharacterProvider({ children, overrideCharacter }:
                                  Readonly<{
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
        <CharacterRootProvider>
            {children}
        </CharacterRootProvider>
    );
}
