import { useMemo } from 'react'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { useTranslation } from 'react-i18next'
import { DEFAULT_EXCHANGE_RATES, ExchangeRates } from '@/types'
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import useInputNumberState from '@/hooks/useInputNumberState.ts';

/**
 * StatAdjustmentPopup - Allows editing HP, Luck, and currencies with exchange rates
 */
function HeaderInfoPopup({ onClose }: Readonly<{ onClose: () => void }>) {
    const { t } = useTranslation();
    const { character, updateCharacter } = useCharacter();

    // Local state for form inputs
    const [currentHp, setCurrentHp] = useInputNumberState(character.currentHp);
    const [rads, setRads] = useInputNumberState(character.rads);
    const [caps, setCaps] = useInputNumberState(character.caps);
    const [ncrDollars, setNcrDollars] = useInputNumberState(character.ncrDollars);
    const [legionDenarius, setLegionDenarius] = useInputNumberState(character.legionDenarius);
    const [prewarMoney, setPrewarMoney] = useInputNumberState(character.prewarMoney);
    const [currentLuck, setCurrentLuck] = useInputNumberState(character.currentLuck);

    // Effective max HP is reduced by rads
    const effectiveMaxHp = character.maxHp - Number(rads);

    // Exchange rates state (user-configurable)
    const [rateNcr, setRateNcr] = useInputNumberState(character.exchangeRates?.ncrDollars ?? DEFAULT_EXCHANGE_RATES.ncrDollars);
    const [rateLegion, setRateLegion] = useInputNumberState(character.exchangeRates?.legionDenarius ?? DEFAULT_EXCHANGE_RATES.legionDenarius);
    const [ratePrewar, setRatePrewar] = useInputNumberState(character.exchangeRates?.prewarMoney ?? DEFAULT_EXCHANGE_RATES.prewarMoney);

    // Get effective exchange rates for calculation
    const effectiveRates = useMemo(
        () => ({
            ncrDollars:
                typeof rateNcr === 'number' && rateNcr > 0
                    ? rateNcr
                    : DEFAULT_EXCHANGE_RATES.ncrDollars,
            legionDenarius:
                typeof rateLegion === 'number' && rateLegion > 0
                    ? rateLegion
                    : DEFAULT_EXCHANGE_RATES.legionDenarius,
            prewarMoney:
                typeof ratePrewar === 'number' && ratePrewar > 0
                    ? ratePrewar
                    : DEFAULT_EXCHANGE_RATES.prewarMoney,
        }),
        [rateNcr, rateLegion, ratePrewar],
    );

    // Calculate total wealth in caps equivalent
    const totalCapsEquivalent = useMemo(() => {
        const capsVal = Number(caps);
        const ncrVal = Number(ncrDollars);
        const legionVal = Number(legionDenarius);
        const prewarVal = Number(prewarMoney);

        return (
            capsVal +
            Math.floor(ncrVal / effectiveRates.ncrDollars) +
            Math.floor(legionVal / effectiveRates.legionDenarius) +
            Math.floor(prewarVal / effectiveRates.prewarMoney)
        );
    }, [caps, ncrDollars, legionDenarius, prewarMoney, effectiveRates]);

    const onConfirm = () => {
        if (!isFormValid) {
            return;
        }

        const exchangeRates: ExchangeRates = {
            ncrDollars: typeof rateNcr === 'number' ? rateNcr : DEFAULT_EXCHANGE_RATES.ncrDollars,
            legionDenarius:
                typeof rateLegion === 'number' ? rateLegion : DEFAULT_EXCHANGE_RATES.legionDenarius,
            prewarMoney:
                typeof ratePrewar === 'number' ? ratePrewar : DEFAULT_EXCHANGE_RATES.prewarMoney,
        };

        updateCharacter({
            currentHp,
            rads: typeof rads === 'number' ? rads : 0,
            caps,
            ncrDollars,
            legionDenarius,
            prewarMoney,
            exchangeRates,
            currentLuck,
        });
    };

    // Generic number input handler
    const handleNumberChange = (
        setter: (val: number | '') => void,
        min = 0,
        max?: number
    ) =>
        e => {
            const val = e.target.value;
            if (val === '') {
                setter('');
            } else {
                const num = Number.parseFloat(val);
                if (!Number.isNaN(num)) {
                    let clamped = Math.max(min, num);
                    if (max !== undefined) {
                        clamped = Math.min(clamped, max);
                    }
                    setter(clamped);
                }
            }
        };

    const isFormValid =
        currentHp !== '' &&
        rads !== '' &&
        currentLuck !== '' &&
        caps !== '' &&
        ncrDollars !== '' &&
        legionDenarius !== '' &&
        prewarMoney !== '' &&
        rateNcr !== '' &&
        rateLegion !== '' &&
        ratePrewar !== '';

    if (!character) {
        return null;
    }

    // Currency data for table rendering
    const currencies = [
        { id: 'caps', icon: 'caps', value: caps, setter: setCaps, rate: null, rateSetter: null },
        {
            id: 'ncrDollars',
            icon: 'ncrDollars',
            value: ncrDollars,
            setter: setNcrDollars,
            rate: rateNcr,
            rateSetter: setRateNcr,
        },
        {
            id: 'legionDenarius',
            icon: 'legionDenarius',
            value: legionDenarius,
            setter: setLegionDenarius,
            rate: rateLegion,
            rateSetter: setRateLegion,
        },
        {
            id: 'prewarMoney',
            icon: 'prewarMoney',
            value: prewarMoney,
            setter: setPrewarMoney,
            rate: ratePrewar,
            rateSetter: setRatePrewar,
        },
    ];

    return (
        <BasePopup
            title="edit"
            onConfirm={onConfirm}
            onClose={onClose}
            disabled={!isFormValid}
            className="stat-adjustment-popup"
        >
            <hr />

            {/* HP, Rads & Luck Section */}
            <div className="stat-adjustment-popup__section">
                <table className="stat-adjustment-popup__stats-table">
                    <tbody>
                    {/* HP Row */}
                    <tr>
                        <th scope="row">
                            <div className="stat-adjustment-popup__stat-label">
                                <div
                                    className="themed-svg stat-adjustment-popup__stat-label-icon"
                                    data-icon="hp"
                                />
                                HP
                            </div>
                        </th>
                        <td>
                            <div
                                className="stat-adjustment-popup__stat-inputs"
                                style={{ justifyContent: 'space-between' }}
                            >
                                <div>
                                    <input
                                        type="number"
                                        className="stat-adjustment-popup__stat-input"
                                        value={currentHp}
                                        onChange={handleNumberChange(
                                            setCurrentHp,
                                            0,
                                            effectiveMaxHp,
                                        )}
                                        min="0"
                                        max={effectiveMaxHp}
                                    />
                                    <span className="stat-adjustment-popup__stat-max">
                                            &nbsp;/ {effectiveMaxHp}
                                        </span>
                                </div>
                                <div>
                                    <i
                                        className="fas fa-radiation stat-adjustment-popup__rads-icon"
                                        title={t('radiation')}
                                        style={{ padding: '0.3rem' }}
                                    />
                                    <input
                                        type="number"
                                        className="stat-adjustment-popup__rads-input"
                                        value={rads}
                                        onChange={handleNumberChange(
                                            setRads,
                                            0,
                                            character.maxHp,
                                        )}
                                        min="0"
                                        max={character.maxHp}
                                        title={t('radiation')}
                                    />
                                </div>
                            </div>
                        </td>
                    </tr>
                    {/* Luck Row */}
                    <tr>
                        <th scope="row">
                            <div className="stat-adjustment-popup__stat-label">
                                <div
                                    className="themed-svg stat-adjustment-popup__stat-label-icon"
                                    data-icon="luck"
                                />
                                {t('luck')}
                            </div>
                        </th>
                        <td>
                            <div className="stat-adjustment-popup__stat-inputs">
                                <input
                                    type="number"
                                    className="stat-adjustment-popup__stat-input"
                                    value={currentLuck}
                                    onChange={handleNumberChange(
                                        setCurrentLuck,
                                        0,
                                        character.maxLuck,
                                    )}
                                    min="0"
                                    max={character.maxLuck}
                                />
                                <span className="stat-adjustment-popup__stat-max">
                                        &nbsp;/ {character.maxLuck}
                                    </span>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <hr />

            {/* Currency Section */}
            <div className="stat-adjustment-popup__section">
                <h3 className="stat-adjustment-popup__section-title">{t('currency')}</h3>

                <table className="stat-adjustment-popup__currency-table">
                    <thead>
                    <tr>
                        <th>{t('type')}</th>
                        <th>{t('amount')}</th>
                        <th>{t('rate')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currencies.map(currency => (
                        <tr key={currency.id}>
                            <td>
                                <div className="stat-adjustment-popup__currency-name">
                                    <div
                                        className="themed-svg stat-adjustment-popup__currency-icon"
                                        data-icon={currency.icon}
                                    />
                                    <span className="stat-adjustment-popup__currency-label">
                                            {t(currency.id)}
                                        </span>
                                </div>
                            </td>
                            <td>
                                <input
                                    type="number"
                                    className="stat-adjustment-popup__currency-input"
                                    value={currency.value}
                                    onChange={handleNumberChange(currency.setter, 0)}
                                    min="0"
                                />
                            </td>
                            <td>
                                <div className="stat-adjustment-popup__rate-cell">
                                    {currency.rateSetter ? (
                                        <>
                                            <input
                                                type="number"
                                                className="stat-adjustment-popup__rate-input"
                                                value={currency.rate}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    width: '2rem',
                                                }}
                                                onChange={handleNumberChange(
                                                    currency.rateSetter,
                                                    0.1,
                                                )}
                                                min="0.1"
                                                step="0.1"
                                            />
                                            <span className="stat-adjustment-popup__rate-fixed">
                                                    &nbsp;: 1
                                                </span>
                                        </>
                                    ) : (
                                        <span className="stat-adjustment-popup__rate-fixed">
                                                1 : 1
                                            </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Total Caps Equivalent */}
                <div className="stat-adjustment-popup__total">
                    <span className="stat-adjustment-popup__total-label">{t('total')}:</span>
                    <span className="stat-adjustment-popup__total-value">
                        {totalCapsEquivalent}
                    </span>
                    <div
                        className="themed-svg small-icon"
                        data-icon="caps"
                    />
                </div>
            </div>

            <hr />
        </BasePopup>
    );
}

export default HeaderInfoPopup
