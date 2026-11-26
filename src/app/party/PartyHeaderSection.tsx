import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PartyPopup from '@/app/party/PartyPopup.tsx';
import { useParty } from '@/app/party/PartyProvider.tsx';

/** Header block with the group AP. Always visible; clicking opens the party popup. */
function PartyHeaderSection() {
    const { t } = useTranslation();
    const { pool } = useParty();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className="app-header__party"
                title={t('partyButton')}
                onClick={() => setIsOpen(true)}
            >
                <span className="app-header__label">{t('partyPoolShort')}</span>
                <span className="app-header__value">{pool.groupAP}</span>
            </button>
            {isOpen && <PartyPopup onClose={() => setIsOpen(false)} />}
        </>
    );
}

export default PartyHeaderSection;
