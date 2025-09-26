import { useRef } from 'react'

/**
 * Custom hook for handling long press interactions
 * @param {Function} onLongPress - Callback function to execute on long press
 * @param {number} delay - Delay in milliseconds for long press (default: 500)
 * @returns {Object} Event handlers for pointer events
 */
export const useLongPress = (onLongPress, delay = 500) => {
    const longPressTimer = useRef(null)

    const handlePointerDown = (e) => {
        // Only trigger on left mouse button or touch
        if (e.button !== 0) return

        longPressTimer.current = setTimeout(() => {
            onLongPress()
        }, delay)
    }

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    const handlePointerLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    return {
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerLeave
    }
}
