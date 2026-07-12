import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './Toast.css'

export type ToastVariant = 'info' | 'danger'

export interface ToastAction {
    label: string
    onClick: () => void
}

interface ToastProps {
    message: string
    variant?: ToastVariant
    action?: ToastAction
    onDismiss: () => void
}

/**
 * Generic dismissable toast notification.
 * Sits fixed at the bottom-center of the screen.
 *
 * Variants:
 * - `info` (default): primary color border + glow (e.g. update available)
 * - `danger`: failure color border (e.g. HP damage warning)
 */
export default function Toast({ message, variant = 'info', action, onDismiss }: Readonly<ToastProps>) {
    const { t } = useTranslation()
    const [dismissing, setDismissing] = useState(false)

    const handleDismiss = useCallback(() => {
        setDismissing(true)
    }, [])

    return (
        <div
            className={`toast toast--${variant}${dismissing ? ' toast--dismissing' : ''}`}
            role="alert"
            onAnimationEnd={dismissing ? onDismiss : undefined}
        >
            <span className="toast__message">{message}</span>
            <div className="toast__actions">
                {action && (
                    <button
                        className="toast__btn toast__btn--action"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </button>
                )}
                <button
                    className="toast__btn toast__btn--dismiss"
                    onClick={handleDismiss}
                    title={t('dismiss')}
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
        </div>
    )
}


