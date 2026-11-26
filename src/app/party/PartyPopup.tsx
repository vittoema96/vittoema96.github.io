import { useTranslation } from 'react-i18next';
import BasePopup from '@/app/components/popup/common/BasePopup.tsx';
import { useParty } from '@/app/party/PartyProvider.tsx';

/** Header popup: only edits the group AP. Groups are managed in Settings → Party. */
function PartyPopup({ onClose }: Readonly<{ onClose: () => void }>) {
    const { t } = useTranslation();
    const party = useParty();

    return (
        <BasePopup title={t('partyGroupAP')} onClose={onClose} className="party-popup">
            <div className="party-body">
                {!party.inParty && <p className="text-warning">{t('partyNeedGroup')}</p>}
                {party.inParty && (
                    <p className="party-hint">
                        {t(
                            party.groupStatus === 'synced'
                                ? 'partySyncSynced'
                                : party.groupStatus === 'pending'
                                  ? 'partySyncPending'
                                  : 'partySyncOffline',
                        )}
                    </p>
                )}

                <div className="party-pa">
                    <span className="party-pa__value">{party.pool.groupAP}</span>
                    <div className="party-pa__controls">
                        <button
                            onClick={() => party.adjust('groupAP', -1)}
                            aria-label={`-1 ${t('partyGroupAP')}`}
                        >
                            -
                        </button>
                        <button
                            onClick={() => party.adjust('groupAP', 1)}
                            aria-label={`+1 ${t('partyGroupAP')}`}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        </BasePopup>
    );
}

export default PartyPopup;
