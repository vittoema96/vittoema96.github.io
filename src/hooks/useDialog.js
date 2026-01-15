import { useEffect } from 'react'

/**
 * Custom hook for managing HTML dialog elements
 * Handles opening/closing and backdrop clicks
 *
 * @param {Object} dialogRef - React ref to the dialog element
 * @param {boolean} isOpen - Whether the dialog should be open
 * @param {Function} onClose - Callback when dialog should close
 * @returns {Object} { handleBackdropClick, closeWithAnimation }
 */
export const useDialog = (dialogRef, isOpen, onClose) => {
    // Dialog management - open/close based on isOpen prop
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen && !dialog.open) {
            dialog.showModal()
        } else if (!isOpen && dialog.open) {
            dialog.close()
        }
    }, [isOpen, dialogRef])

    // Handle backdrop click (click outside dialog)
    const handleBackdropClick = (e) => {
        if (e.target === dialogRef.current) {
            onClose()
        }
    }

    // Close dialog with animation
    const closeWithAnimation = (callback) => {
        const dialog = dialogRef.current
        if (dialog && dialog.open) {
            dialog.classList.add('dialog-closing')
            dialog.addEventListener(
                'animationend',
                () => {
                    dialog.classList.remove('dialog-closing')
                    if (dialog.open) {
                        dialog.close()
                    }
                    if (callback) callback()
                    onClose()
                },
                { once: true }
            )
        } else {
            if (callback) callback()
            onClose()
        }
    }

    return { handleBackdropClick, closeWithAnimation }
}

