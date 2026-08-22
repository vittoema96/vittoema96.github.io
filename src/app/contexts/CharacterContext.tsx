import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { CharacterItem, RawCharacter } from '@/types';
import useCalculatedCharacter from '@/hooks/useCalculatedCharacter';
import { getOriginById, OriginId, ORIGINS } from '@/features/character/origin.ts';
import { RawCharacterSchema } from '@/schemas/characterSchemas.ts';
import { z } from 'zod';
import { adjustCurrentHp } from '@/features/character/hp.ts';
import { allItems } from '@/data';
import { isType } from '@/features/item/utils.ts';
import { useActiveCharacter, useSaveStore } from '@/hooks/useSaveStore.ts';

// Default plating mod for robot parts (slot 0)
// TODO this should not be handled here (? or does it?)
const DEFAULT_PLATING_MOD = 'modRobotPlatingStandard';

// --- Pure Inventory Calculation Helpers ---

// TODO All this should be moved to useCalculatedCharacter or elsewhere
const updateItems = (prevOrigin: OriginId, updatedCharacter: RawCharacter) => {
    // If origin changed from or to one that needs SpecializedArmor, unequip all apparel
    // This needs to be done BEFORE adding/removing robot parts (otherwise after adding them they would be unequipped)
    const changedOrigin = prevOrigin !== updatedCharacter.origin;
    const currentOrigin = getOriginById(updatedCharacter.origin);

    // TODO this is better but we need a more robust implementation
    //  currently supermutant is not handled
    const hasToUnequip =
        changedOrigin &&
        (getOriginById(prevOrigin).needsSpecializedArmor || currentOrigin.needsSpecializedArmor);
    if (hasToUnequip) {
        let filterCategories = ['robotPart', 'superMutantArmor'];
        let include = true;
        if (currentOrigin.isRobot) {
            include = false;
            filterCategories = ['robotPart'];
        }
        if (currentOrigin === ORIGINS.SUPER_MUTANT) {
            include = false;
            filterCategories = ['superMutantArmor']; // TODO add this category
        }
        updatedCharacter.items =
            updatedCharacter.items.map(item => {
                const itemData = allItems[item.id];
                if (
                    isType(itemData, 'apparel') &&
                    item.equipped &&
                    filterCategories.includes(itemData.CATEGORY) === include
                ) {
                    return { ...item, equipped: false };
                }
                return item;
            }) || [];
    }

    const items = updatedCharacter.items;
    const hasRobotParts = items.some(i =>
        currentOrigin.bodyParts.has(i.id as any),
    );
    if (currentOrigin.isRobot) {
        let newParts: CharacterItem[] = [];
        if (!hasRobotParts) {
            newParts = Array.from(currentOrigin.bodyParts, id => ({
                id,
                quantity: 1,
                equipped: true,
                mods: [DEFAULT_PLATING_MOD],
            }));
        }
        updatedCharacter.items = [...items, ...newParts];
    }
    return updatedCharacter;
};

function useCharacterProviderValue() {
    const {
        activeSlot,
        setActiveSlot,
        slots,
        updateActiveCharacter,
        deleteSlot,
        importSlot,
        resetActiveCharacter,
    } = useSaveStore();

    const rawCharacter = useActiveCharacter();
    const calculatedCharacter = useCalculatedCharacter(rawCharacter);

    const updateCharacter = useCallback(
        (updates: z.input<typeof RawCharacterSchema>): void => {
            updateActiveCharacter(prev => {
                let updatedCharacter: RawCharacter = RawCharacterSchema.parse({
                    ...prev,
                    ...updates,
                    special: { ...prev?.special, ...updates.special },
                    skills: { ...prev?.skills, ...updates.skills },
                    companions: { ...prev.companions, ...updates.companions}
                });

                // Let's do it always, as various things can edit current and max hp (perkLifeGiver for example)
                updatedCharacter = adjustCurrentHp(prev, updatedCharacter);

                // TODO to review / remove
                updatedCharacter = updateItems(prev?.origin, updatedCharacter);
                return updatedCharacter;
            });
        },
        [updateActiveCharacter],
    );

    /**
     * Replenish current luck to max ("luck" value)
     */
    const replenishLuck = useCallback(() => {
        updateCharacter({ currentLuck: calculatedCharacter.maxLuck });
    }, [calculatedCharacter.maxLuck, updateCharacter]);

    /**
     * Spend luck point (decrease current luck by 1)
     */
    const spendLuck = useCallback(() => {
        updateCharacter({ currentLuck: Math.max(0, calculatedCharacter.currentLuck - 1) });
    }, [calculatedCharacter.currentLuck, updateCharacter]);

    // Memoize context value to prevent unnecessary re-renders
    return useMemo(
        () => ({
            rawCharacter: rawCharacter,
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
            rawCharacter,
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
        ],
    );
}

export type CharacterContextValue = ReturnType<typeof useCharacterProviderValue>;

const CharacterContext = createContext<CharacterContextValue | undefined>(undefined);

/** Convenience hook — throws if used outside a `CharacterProvider`. */
export const useCharacter = (): CharacterContextValue => {
    const context = useContext(CharacterContext);
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider');
    }
    return context;
};

export function CharacterProvider({ children }: Readonly<{ children: ReactNode }>) {
    const value = useCharacterProviderValue();
    return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}
