import BasePopup from '@/contexts/popup/common/BasePopup.tsx';

interface AlertPopupProps {
    onClose: () => void;
    content: string;
    onConfirm: () => void;
    showConfirm: boolean;
}

// TODO Do we need this class? Maybe use BasePopup directly?
function AlertPopup({ onClose, content, onConfirm, showConfirm = false }: Readonly<AlertPopupProps>) {

    // Always render the dialog, but control visibility with showModal/close
    return (
        <BasePopup
            title={showConfirm ? 'confirm' : 'warning'}
            onConfirm={showConfirm ? onConfirm : undefined}
            onClose={onClose}>
            <hr />
            <p>{content}</p>
            <hr />
        </BasePopup>
    )
}

export default AlertPopup
