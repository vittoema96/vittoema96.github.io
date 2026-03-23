import BasePopup from '@/components/popup/common/BasePopup.tsx';

interface AlertPopupProps {
    onClose: () => void;
    content: string;
    onConfirm: () => void;
    showConfirm: boolean;
}

// TODO Do we need this class? Maybe use BasePopup directly?
function AlertPopup({ onClose, content, onConfirm, showConfirm = false }: Readonly<AlertPopupProps>) {
    return (
        <BasePopup
            title={showConfirm ? 'confirm' : 'warning'}
            onConfirm={showConfirm ? onConfirm : undefined}
            onClose={onClose}
        >
            <hr />
            <p style={{ whiteSpace: 'pre-line' }}>{content}</p>
        </BasePopup>
    )
}

export default AlertPopup

