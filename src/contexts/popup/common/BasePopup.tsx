import { useTranslation } from 'react-i18next';
import PopupHeader from '@/contexts/popup/common/PopupHeader.tsx';
import React, { useRef } from 'react';
import { useDialog } from '@/hooks/useDialog.ts';

interface BasePopupProps {
    title: string;
    onConfirm?: (() => void) | undefined;
    confirmLabel?: string;
    onClose: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

function BasePopup({
       title,
       onConfirm,
       confirmLabel,
       onClose,
       disabled,
       className,
       children
    }: Readonly<BasePopupProps>) {
    const { t } = useTranslation();

    const dialogRef = useRef<HTMLDialogElement>(null)
    const { closeWithAnimation } = useDialog(dialogRef, onClose)

    return (

        <dialog ref={dialogRef} className={className}>
            <PopupHeader title={title} onClose={() => closeWithAnimation()}/>

            {children}

            <footer style={{
                        padding: 0,
                        marginTop: '0.25rem',
                        gap: '0.5rem'
                    }}>
                    {onConfirm && (
                        <button
                            className="popup__button-confirm"
                            onClick={() => closeWithAnimation(onConfirm)}
                            disabled={disabled}
                        >
                            {t(confirmLabel ?? 'confirm')}
                        </button>
                    )
                    }
                <button
                    className="popup__button-close"
                    onClick={() => closeWithAnimation()}
                >
                    {t('close')}
                </button>
            </footer>
        </dialog>
    );
}

export default BasePopup
