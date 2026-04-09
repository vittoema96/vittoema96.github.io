import { useState, useCallback } from 'react'
import { useLongPress } from './useLongPress'
import { CharacterItem, CustomItem } from '@/types';
import { useInventoryActions } from '@/features/inv/hooks/useInventoryActions.ts';

export const useOverlay = (
    characterItem: CharacterItem | CustomItem,
    canSell=false,
    canDelete=false,
) => {
    const [showOverlay, setShowOverlay] = useState(false)

    const { sellItem, deleteItem } = useInventoryActions()

    const handleShowOverlay = useCallback(() => {
        setShowOverlay(true)
    }, [])

    const handleHideOverlay = useCallback(() => {
        setShowOverlay(false)
    }, [])

    const handleSell = useCallback(() => {
        if (canSell) {
            sellItem(characterItem)
        }
        setShowOverlay(false)
    }, [canSell, characterItem, sellItem])

    const handleDelete = useCallback(() => {
        if (canDelete) {
            deleteItem(characterItem)
        }
        setShowOverlay(false)
    }, [canDelete, characterItem, deleteItem])

    const longPressHandlers = useLongPress(handleShowOverlay)

    return {
        showOverlay,
        handleHideOverlay,
        handleSell,
        handleDelete,
        longPressHandlers
    }
}
