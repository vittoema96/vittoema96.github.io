import React, { useRef } from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useDialog } from '../../hooks/useDialog.js'

function AlertPopup({ isOpen, onClose, title, content, onConfirm, showConfirm = false }) {
    const dialogRef = useRef(null)
    const t = useI18n()

    // Use dialog hook for dialog management
    const { handleBackdropClick, closeWithAnimation } = useDialog(dialogRef, isOpen, onClose)

    const handleClose = () => {
        closeWithAnimation()
    }

    const handleConfirm = () => {
        if (onConfirm) {
            closeWithAnimation(onConfirm)
        } else {
            handleClose()
        }
    }

    const handleBackdrop = (e) => {
        // Close if clicking on backdrop (the dialog element itself)
        if (e.target === dialogRef.current) {
            handleClose()
        }
    }

    // Always render the dialog, but control visibility with showModal/close
    return (
        <dialog
            ref={dialogRef}
            onClick={handleBackdrop}
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
