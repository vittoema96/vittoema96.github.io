import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParty } from '@/app/party/PartyProvider.tsx';
import { type RosterMember } from '@/features/party/useGroup.ts';

/** Settings → Party: create or join a group, or manage the one the active character is in. */
function PartyPanel() {
    const { t } = useTranslation();
    const party = useParty();
    const [draft, setDraft] = useState('');
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        if (!party.code) {
            return;
        }
        void navigator.clipboard?.writeText(party.code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    if (!party.inParty) {
        return (
            <div className="party-body">
                <p className="party-hint">{t('partyNotJoined')}</p>
                <button className="confirmButton" onClick={party.create}>
                    {t('partyCreate')}
                </button>

                <hr />

                <div className="row party-code-row">
                    <label htmlFor="party-code-input">{t('partyCodeLabel')}:</label>
                    <input
                        id="party-code-input"
                        type="text"
                        value={draft}
                        maxLength={20}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        onChange={e => setDraft(e.target.value)}
                    />
                    <button onClick={() => party.join(draft)}>{t('partyJoin')}</button>
                </div>
            </div>
        );
    }

    return (
        <div className="party-body">
            <section className="party-block">
                <span className="party-label">{t('partyCodeLabel')}</span>
                <div className="party-code-row">
                    <div className="party-code-box">
                        <strong className="party-code">{party.code}</strong>
                    </div>
                    <button onClick={copyCode}>{copied ? t('partyCopied') : t('partyCopy')}</button>
                </div>
                <p className="party-hint">{t('partyShareHint')}</p>
            </section>

            <hr />

            <section className="party-block">
                <span className="party-label">
                    {t('partyPlayers', { count: party.members.length })}
                </span>
                {party.members.length <= 1 && <p className="party-hint">{t('partyWaiting')}</p>}
                <div className="stack">
                    {party.members.map(member => (
                        <PartyMemberRow key={member.memberId} member={member} />
                    ))}
                </div>
            </section>

            <hr />

            <button onClick={party.leave}>{t('partyLeave')}</button>
        </div>
    );
}

/** Same card layout as the character slots in Settings → Characters. */
function PartyMemberRow({ member }: Readonly<{ member: RosterMember }>) {
    const { t } = useTranslation();
    const name = member.name || t('partyUnnamed');
    const origin = member.origin ? t(member.origin) : t('partyNoOrigin');
    const level = member.level > 0 ? `${t('partyLevelShort')}. ${member.level}` : t('partyNoLevel');

    return (
        <div
            className="row u-padding-m u-rounded-s"
            style={{
                border: member.self
                    ? 'var(--border-primary-thick)'
                    : 'var(--border-secondary-thin)',
                backgroundColor: member.self ? 'var(--secondary-color)' : 'transparent',
            }}
        >
            <div className="stack no-gap" style={{ flex: 1, minWidth: '130px' }}>
                <span className="h4">
                    {name}
                    {member.self && ` (${t('partyYou')})`}
                </span>
                <span className="h5">{origin}</span>
                <span className="h5">{level}</span>
                <span className="h5 party-status">
                    <span
                        className={
                            member.online ? 'party-status__dot is-online' : 'party-status__dot'
                        }
                    >
                        {member.online ? '●' : '○'}
                    </span>{' '}
                    {member.online
                        ? t('partyOnline')
                        : member.lastSeen
                          ? t('partyLastSeen', {
                                date: new Date(member.lastSeen).toLocaleString(undefined, {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }),
                            })
                          : t('partyOffline')}
                </span>
            </div>
        </div>
    );
}

export default PartyPanel;
