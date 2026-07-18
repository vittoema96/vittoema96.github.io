import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PerkSelectionPopup,
    TraitSelectionPopup,
} from './FeatSelectionPopup.tsx';

interface TraitPerkSelectorProps {
    type: 'trait' | 'perk';
    onSelect: (id: string) => void;
}

/**
 * Selector component for choosing a trait or perk
 * Shows as a "+ Add Trait/Perk" button that opens a popup when clicked
 */
function TraitPerkSelector({ type, onSelect }: Readonly<TraitPerkSelectorProps>) {
    const { t } = useTranslation();
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleButtonClick = () => {
        setIsPopupOpen(true);
    };

    const handleSelect = (id: string) => {
        onSelect(id);
        setIsPopupOpen(false);
    };

    const FeatSelectionPopup = type === 'perk' ? PerkSelectionPopup : TraitSelectionPopup

    return (
        <>
            <button
                onClick={handleButtonClick}
                className="inventory-row"
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--background-color)',
                    border: 'var(--border-primary-thin)',
                    borderStyle: 'dashed',
                    opacity: 0.7,
                }}
            >
                <i className="fas fa-plus" style={{ fontSize: '0.9rem' }}></i>
                <span>{type === 'trait' ? t('addTrait') : t('addPerk')}</span>
            </button>

            {isPopupOpen && (
                <FeatSelectionPopup
                    prev={undefined}
                    onSelect={handleSelect}
                    onClose={() => setIsPopupOpen(false)}
                />
            )}
        </>
    );
}

export default TraitPerkSelector;

