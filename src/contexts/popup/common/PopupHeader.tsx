import { FitText } from '@/app/FitText.tsx';
import { useTranslation } from 'react-i18next';

interface PopupHeaderProps {
    title: string;
    onClose: () => void;
}

function PopupHeader({ title, onClose }: Readonly<PopupHeaderProps>) {
    const { t } = useTranslation();
    return (
        <div className="row l-lastSmall">
            <div style={{ padding: '0.5rem' }}>
                <FitText minSize={20} maxSize={40}>
                    {t(title)}
                </FitText>
            </div>
            <button className="popup__button-x" onClick={() => onClose()}>
                &times;
            </button>
        </div>
    );
}

export default PopupHeader
