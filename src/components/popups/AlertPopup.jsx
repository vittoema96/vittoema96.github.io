import React, { useEffect, useRef } from 'react'
import { useI18n } from '../../hooks/useI18n.js'

function AlertPopup({ isOpen, onClose, title, content, onConfirm, showConfirm = false }) {
    const dialogRef = useRef(null)
    const t = useI18n()

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen && !dialog.open) {
            dialog.showModal()
        } else if (!isOpen && dialog.open) {
            dialog.close()
        }
    }, [isOpen])

    const handleClose = () => {
        const dialog = dialogRef.current
        if (dialog && dialog.open) {
            // Add closing animation class
            dialog.classList.add('dialog-closing')
            dialog.addEventListener(
                'animationend',
                () => {
                    dialog.classList.remove('dialog-closing')
                    if (dialog.open) {
                        dialog.close()
                    }
                    onClose()
                },
                { once: true }
            )
        } else {
            // If dialog is already closed, just call onClose
            onClose()
        }
    }

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
        }
        handleClose()
    }

    const handleBackdropClick = (e) => {
        // Close if clicking on backdrop (the dialog element itself)
        if (e.target === dialogRef.current) {
            handleClose()
        }
    }

    // Always render the dialog, but control visibility with showModal/close
    return (
        <dialog
            ref={dialogRef}
            onClick={handleBackdropClick}
            style={{
                zIndex: 10000,
                position: 'fixed'
            }}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <header className="l-lastSmall">
                    <span className="h1">
                        {title || t(showConfirm ? 'confirm' : 'warning')}
                    </span>
                    <button className="popup__button-x" onClick={handleClose}>
                        &times;
                    </button>
                </header>
                <hr />
                <p>
                    {content}
                </p>
                <hr />
                <footer>
                    {showConfirm && (
                        <button
                            className="popup__button-confirm"
                            onClick={handleConfirm}
                        >
                            {t('confirm')}
                        </button>
                    )}
                    <button
                        className="popup__button-close"
                        onClick={handleClose}
                    >
                        {t('close')}
                    </button>
                </footer>
            </div>
        </dialog>
    )
}

export default AlertPopup
