import { useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for handling long press interactions
 * @param {Function} onLongPress - Callback function to execute on long press
 * @param {number} delay - Delay in milliseconds for long press (default: 500)
 * @returns {Object} Event handlers for pointer events
 */
export const useLongPress = (onLongPress, delay = 500) => {
    const longPressTimer = useRef(null)

    // Clear timer helper (DRY principle)
    const clearTimer = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }, [])

    // Cleanup on unmount to prevent memory leaks
    useEffect(() => {
        return () => clearTimer()
    }, [clearTimer])

    const handlePointerDown = useCallback((e) => {
        // Only trigger on left mouse button or touch
        if (e.button !== 0) {
            return
        }

        longPressTimer.current = setTimeout(() => {
            onLongPress()
        }, delay)
    }, [onLongPress, delay])

    return {
        onPointerDown: handlePointerDown,
        onPointerUp: clearTimer,
        onPointerLeave: clearTimer
    }
}
