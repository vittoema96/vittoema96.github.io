import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialog } from '@/hooks/useDialog'

interface AlertPopupProps {
    onClose: () => void;
    content: string;
    onConfirm: () => void;
    showConfirm: boolean;
}

function AlertPopup({ onClose, content, onConfirm, showConfirm = false }: Readonly<AlertPopupProps>) {
    const { t } = useTranslation()
    const dialogRef = useRef<HTMLDialogElement>(null)

    // Use dialog hook for dialog management
    const { closeWithAnimation } = useDialog(dialogRef, onClose)

    const handleClose = () => {
        closeWithAnimation(() => {})
    }

    const handleConfirm = () => {
        if (onConfirm) {
            closeWithAnimation(onConfirm)
        } else {
            handleClose()
        }
    }

    // Always render the dialog, but control visibility with showModal/close
    return (
        <dialog
            ref={dialogRef}
            style={{
                zIndex: 10000,
                position: 'fixed'
            }}
        >
            <div>
                <header className="l-lastSmall">
                    <span className="h1">
                        {t(showConfirm ? 'confirm' : 'warning')}
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
