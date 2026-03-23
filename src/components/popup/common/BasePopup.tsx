import { useTranslation } from 'react-i18next';
import PopupHeader from '@/components/popup/common/PopupHeader.tsx';
import React, { useRef } from 'react';
import { useDialog } from '@/hooks/useDialog.ts';
import DialogPortal from '@/components/popup/common/DialogPortal.tsx';

interface BasePopupProps {
    title: string;
    confirmLabel?: string;
    onConfirm?: (() => void) | undefined;
    confirmDisabled?: boolean;
    onClose: () => void;
    children: React.ReactNode;
    footerChildren?: React.ReactNode;
    className?: string; // TODO: Remove className later - popups should not need custom styling
}

function BasePopup({
       title,
       confirmLabel = 'confirm',
       onConfirm,
       confirmDisabled = false,
       onClose,
       children,
       footerChildren,
       className
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
                            disabled={confirmDisabled}
                        >
                            {t(confirmLabel)}
                        </button>
                    )}

                    {footerChildren}

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

