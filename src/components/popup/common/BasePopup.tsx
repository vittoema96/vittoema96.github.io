import { useTranslation } from 'react-i18next';
import PopupHeader from '@/components/popup/common/PopupHeader.tsx';
import React, { useRef } from 'react';
import { useDialog } from '@/hooks/useDialog.ts';
import DialogPortal from '@/components/popup/common/DialogPortal.tsx';

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
        <DialogPortal>
            <dialog ref={dialogRef} className={className}>
                <PopupHeader title={title} onClose={() => closeWithAnimation()}/>

                {children}
            <hr/>
                <footer>
                    {onConfirm && (
                        <button
                            className="confirmButton"
                            onClick={() => closeWithAnimation(onConfirm)}
                            disabled={disabled}
                        >
                            {t(confirmLabel ?? 'confirm')}
                        </button>
                    )}
                    <button
                        className="closeButton"
                        onClick={() => closeWithAnimation()}
                    >
                        {t('close')}
                    </button>
                </footer>
            </dialog>
        </DialogPortal>
    );
}

export default BasePopup

