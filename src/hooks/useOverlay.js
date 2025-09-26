import { useState } from 'react'
import { useLongPress } from './useLongPress.js'

/**
 * Custom hook for managing overlay state with long press
 * @param {Function} onSell - Callback for sell action
 * @param {Function} onDelete - Callback for delete action
 * @returns {Object} Overlay state and handlers
 */
export const useOverlay = (onSell, onDelete) => {
    const [showOverlay, setShowOverlay] = useState(false)

    const handleShowOverlay = () => {
        setShowOverlay(true)
    }

    const handleHideOverlay = () => {
        setShowOverlay(false)
    }

    const handleSell = () => {
        if (onSell) {
            onSell()
        }
        setShowOverlay(false)
    }

    const handleDelete = () => {
        if (onDelete) {
            onDelete()
        }
        setShowOverlay(false)
    }

    const longPressHandlers = useLongPress(handleShowOverlay)

    return {
        showOverlay,
        handleHideOverlay,
        handleSell,
        handleDelete,
        longPressHandlers
    }
}
