import BasePopup from '@/app/components/popup/common/BasePopup.tsx';
import { useTranslation } from 'react-i18next';

interface ChoicePopupProps<T> {
    onClose: () => void;
    content: string;
    confirm: T[];
    onConfirm: (t: T) => void;
}

function ChoicePopup<T extends string>({ onClose, content, onConfirm, confirm }: Readonly<ChoicePopupProps<T>>) {

    const { t } = useTranslation();

    return (
        <BasePopup
            title={"choose"}
            footerChildren={confirm.map((label) => (
                <button
                    key={label}
                    className="confirmButton"
                    onClick={() => {
                        onConfirm(label)
                        onClose()
                    }}
                >
                    {t(label)}
                </button>
            ))}
            onClose={onClose}
        >
            <hr />
            <p style={{ whiteSpace: 'pre-line' }}>{content}</p>
        </BasePopup>
    )
}

export default ChoicePopup

