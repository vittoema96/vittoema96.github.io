import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { calculateCharacter } from '@/features/character/calculate.ts';
import { useActiveCharacter, useSaveStore } from '@/hooks/useSaveStore.ts';

function useCharacterProviderValue() {
    const {
        activeSlot,
        setActiveSlot,
        slots,
        updateActiveCharacter: updateCharacter,
        deleteSlot,
        importSlot,
        resetActiveCharacter,
    } = useSaveStore();

    const rawCharacter = useActiveCharacter();
    const calculatedCharacter = useMemo(() => calculateCharacter(rawCharacter), [rawCharacter]);

    /**
     * Replenish current luck to max ("luck" value)
     */
    const replenishLuck = useCallback(() => {
        updateCharacter(prev => ({ currentLuck: calculateCharacter(prev).maxLuck }));
    }, [updateCharacter]);

    /**
     * Spend luck point (decrease current luck by 1)
     */
    const spendLuck = useCallback(() => {
        updateCharacter(prev => ({
            currentLuck: Math.max(0, calculateCharacter(prev).currentLuck - 1),
        }));
    }, [updateCharacter]);

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
