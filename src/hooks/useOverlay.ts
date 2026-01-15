import { useState, useCallback } from 'react'
import { useLongPress } from './useLongPress'

/**
 * Custom hook for managing overlay state with long press
 * @param {Function} onSell - Callback for sell action
 * @param {Function} onDelete - Callback for delete action
 * @returns {Object} Overlay state and handlers
 */
export const useOverlay = (onSell, onDelete) => {
    const [showOverlay, setShowOverlay] = useState(false)

    const handleShowOverlay = useCallback(() => {
        setShowOverlay(true)
    }, [])

    const handleHideOverlay = useCallback(() => {
        setShowOverlay(false)
    }, [])

    const handleSell = useCallback(() => {
        if (onSell) {
            onSell()
        }
        setShowOverlay(false)
    }, [onSell])

    const handleDelete = useCallback(() => {
        if (onDelete) {
            onDelete()
        }
        setShowOverlay(false)
    }, [onDelete])

    const longPressHandlers = useLongPress(handleShowOverlay)

    return {
        showOverlay,
        handleHideOverlay,
        handleSell,
        handleDelete,
        longPressHandlers
    }
}
