import React, { useEffect } from 'react'

/**
 * Custom hook for managing HTML dialog elements
 * Handles opening/closing and backdrop clicks
 */
export const useDialog =
    (dialogRef: React.RefObject<HTMLDialogElement | null>, onClose: () => void) => {
    // Dialog management - open dialog on mount
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) {return}

        if (!dialog.open) {
            dialog.showModal()
        }
    }, [dialogRef])

    // Close dialog with animation
    const closeWithAnimation = (callback: () => void = () => {}) => {
        const dialog = dialogRef.current
        if (dialog?.open) {
            dialog.classList.add('dialog-closing')
            dialog.addEventListener(
                'animationend',
                () => {
                    dialog.classList.remove('dialog-closing')
                    if (dialog.open) {
                        dialog.close()
                    }
                    callback()
                    onClose()
                },
                { once: true }
            )
        }
    }

    // Handle backdrop click (close when clicking outside dialog content)
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        const dialog = dialogRef.current
        if (dialog && e.target === dialog) {
            closeWithAnimation()
        }
    }

    return { closeWithAnimation, handleBackdropClick }
}

