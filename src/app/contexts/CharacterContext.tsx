import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { BODY_PARTS, BodyPart, Character, CharacterItem, MR_HANDY_PARTS, MrHandyPart, RawCharacter } from '@/types';
import useCalculatedCharacter from '@/hooks/useCalculatedCharacter';
import { getOriginById, ORIGINS } from '@/features/character/origin.ts';
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';
import { z } from 'zod';
import { adjustCurrentHp } from '@/features/character/hp.ts';
import { allItems } from '@/data';
import { isType } from '@/features/item/utils.ts';
import { useActiveCharacter, useSaveStore } from '@/hooks/useSaveStore.ts';

export interface CharacterContextValue {
    character: Character;
    rawCharacter: RawCharacter | null;
    updateCharacter: (updates: z.input<typeof RawCharacterSchema>) => void;
    replenishLuck: () => void;
    spendLuck: () => void;

    setActiveSlot: (slotIndex: number) => void;
    activeSlot: number;
    slots: (RawCharacter | null)[];
    deleteSlot: (slotIndex: number) => void;
    importSlot: (slotIndex: number, rawData: unknown) => void;
    resetActiveCharacter: () => void;
}

const CharacterContext = createContext<CharacterContextValue | undefined>(undefined);

// Default plating mod for robot parts (slot 0)
// TODO this should not be handled here (? or does it?)
const DEFAULT_PLATING_MOD = 'modRobotPlatingStandard'


/** Convenience hook — throws if used outside a `CharacterProvider`. */
export const useCharacter = (): CharacterContextValue => {
    const context = useContext(CharacterContext);
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider');
    }
    return context;
};

export function CharacterProvider({ children }: Readonly<{ children: ReactNode }>) {
    const {
        activeSlot,
        setActiveSlot,
        slots,
        updateActiveCharacter,
        deleteSlot,
        importSlot,
        resetActiveCharacter,
    } = useSaveStore();

    const activeCharacter = useActiveCharacter();
    const calculatedCharacter = useCalculatedCharacter(activeCharacter);

    const updateCharacter = useCallback((updates: z.input<typeof RawCharacterSchema>): void => {
        updateActiveCharacter((prev) => {
            let updatedCharacter: RawCharacter = RawCharacterSchema.parse({
                ...prev,
                ...updates,
                special: { ...prev?.special, ...updates.special },
                skills: { ...prev?.skills, ...updates.skills },
            });

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
                    const itemData = allItems[item.id]
                    if (isType(itemData, 'apparel')
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
            return updatedCharacter;
        });
    }, [updateActiveCharacter]);

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
            rawCharacter: activeCharacter,
            character: calculatedCharacter,
            updateCharacter,
            replenishLuck,
            spendLuck,
            setActiveSlot,
            activeSlot,
            slots,
            deleteSlot,
            importSlot,
            resetActiveCharacter,
        }),
        [
            activeCharacter,
            calculatedCharacter,
            updateCharacter,
            replenishLuck,
            spendLuck,
            setActiveSlot,
            activeSlot,
            slots,
            deleteSlot,
            importSlot,
            resetActiveCharacter,
        ]
    );

    return (
        <CharacterContext.Provider value={contextValue}>
            {children}
        </CharacterContext.Provider>
    );
}
