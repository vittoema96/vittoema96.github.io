import { useMemo, useState } from 'react'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { useTranslation } from 'react-i18next'
import { DEFAULT_EXCHANGE_RATES } from '@/types'
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';

/**
 * StatAdjustmentPopup - Allows editing HP, Luck, and currencies with exchange rates
 */
function AppHeaderPopup({ onClose }: Readonly<{ onClose: () => void }>) {
    const { t } = useTranslation();
    const { character, updateCharacter } = useCharacter();
    const { showToast } = usePopup();

    const [currentHpInput, setCurrentHpInput] = useState(`${character.currentHp}`);
    const [radsInput, setRadsInput] = useState(`${character.rads}`);
    const [currentLuckInput, setCurrentLuckInput] = useState(`${character.currentLuck}`);

    const [capsInput, setCapsInput] = useState(`${character.caps}`);
    const [ncrDollarsInput, setNcrDollarsInput] = useState(`${character.ncrDollars}`);
    const [legionDenariusInput, setLegionDenariusInput] = useState(`${character.legionDenarius}`);
    const [prewarMoneyInput, setPrewarMoneyInput] = useState(`${character.prewarMoney}`);

    // Exchange rates state (user-configurable)
    const [rateNcrInput, setRateNcrInput] = useState(`${character.exchangeRates.ncrDollars}`);
    const [rateLegionInput, setRateLegionInput] = useState(`${character.exchangeRates.legionDenarius}`);
    const [ratePrewarInput, setRatePrewarInput] = useState(`${character.exchangeRates.prewarMoney}`);

    const clamp = (value: number, min: number, max?: number) => {
        let next = Math.max(min, value);
        if (max !== undefined) {
            next = Math.min(next, max);
        }
        return next;
    };

    const parseResolvedNumber = (
        input: string,
        baseValue: number,
        options?: {
            min?: number,
            max?: number,
            allowRelative?: boolean,
            integer?: boolean,
        },
    ): number | null => {
        const trimmed = input.trim();
        if (!trimmed) {
            return null;
        }

        const parsed = options?.integer
            ? Number.parseInt(trimmed, 10)
            : Number.parseFloat(trimmed);
        if (Number.isNaN(parsed)) {
            return null;
        }

        const allowRelative = options?.allowRelative ?? true;
        const resolved = allowRelative && /^[+-]/.test(trimmed)
            ? baseValue + parsed
            : parsed;

        return clamp(resolved, options?.min ?? Number.NEGATIVE_INFINITY, options?.max);
    };

    const parsedRads = parseResolvedNumber(radsInput, character.rads, {
        min: 0,
        max: character.maxHp,
        integer: true,
    });
    const effectiveMaxHp = Math.max(0, character.maxHp - (parsedRads ?? 0));

    const resolvedValues = {
        currentHp: parseResolvedNumber(currentHpInput, character.currentHp, {
            min: 0,
            max: effectiveMaxHp,
            integer: true,
        }),
        rads: parseResolvedNumber(radsInput, character.rads, {
            min: 0,
            max: character.maxHp,
            integer: true,
        }),
        currentLuck: parseResolvedNumber(currentLuckInput, character.currentLuck, {
            min: 0,
            max: character.maxLuck,
            integer: true,
        }),
        caps: parseResolvedNumber(capsInput, character.caps, { min: 0, integer: true }),
        ncrDollars: parseResolvedNumber(ncrDollarsInput, character.ncrDollars, { min: 0, integer: true }),
        legionDenarius: parseResolvedNumber(legionDenariusInput, character.legionDenarius, { min: 0, integer: true }),
        prewarMoney: parseResolvedNumber(prewarMoneyInput, character.prewarMoney, { min: 0, integer: true }),
        rateNcr: parseResolvedNumber(
            rateNcrInput,
            character.exchangeRates.ncrDollars,
            { min: 0.1, allowRelative: false },
        ),
        rateLegion: parseResolvedNumber(
            rateLegionInput,
            character.exchangeRates.legionDenarius,
            { min: 0.1, allowRelative: false },
        ),
        ratePrewar: parseResolvedNumber(
            ratePrewarInput,
            character.exchangeRates.prewarMoney,
            { min: 0.1, allowRelative: false },
        ),
    };

    // Calculate total wealth in caps equivalent
    const totalCapsEquivalent = useMemo(() => {
        const ncrRate = resolvedValues.rateNcr ?? DEFAULT_EXCHANGE_RATES.ncrDollars;
        const legRate = resolvedValues.rateLegion ?? DEFAULT_EXCHANGE_RATES.legionDenarius;
        const preRate = resolvedValues.ratePrewar ?? DEFAULT_EXCHANGE_RATES.prewarMoney;

        return (
            (resolvedValues.caps ?? character.caps) +
            Math.floor((resolvedValues.ncrDollars ?? character.ncrDollars) / ncrRate) +
            Math.floor((resolvedValues.legionDenarius ?? character.legionDenarius) / legRate) +
            Math.floor((resolvedValues.prewarMoney ?? character.prewarMoney) / preRate)
        );
    }, [
        character.caps,
        character.legionDenarius,
        character.ncrDollars,
        character.prewarMoney,
        resolvedValues.caps,
        resolvedValues.legionDenarius,
        resolvedValues.ncrDollars,
        resolvedValues.prewarMoney,
        resolvedValues.rateLegion,
        resolvedValues.rateNcr,
        resolvedValues.ratePrewar,
    ]);


    const onConfirm = () => {
        if (!isFormValid) {
            return;
        }

        const nextCurrentHp = resolvedValues.currentHp!;
        const nextRads = resolvedValues.rads!;
        const nextCurrentLuck = resolvedValues.currentLuck!;
        const nextCaps = resolvedValues.caps!;
        const nextNcrDollars = resolvedValues.ncrDollars!;
        const nextLegionDenarius = resolvedValues.legionDenarius!;
        const nextPrewarMoney = resolvedValues.prewarMoney!;
        const nextRateNcr = resolvedValues.rateNcr!;
        const nextRateLegion = resolvedValues.rateLegion!;
        const nextRatePrewar = resolvedValues.ratePrewar!;

        const hpRemoved = character.currentHp - nextCurrentHp;

        updateCharacter({
            currentHp: nextCurrentHp,
            rads: nextRads,
            caps: nextCaps,
            ncrDollars: nextNcrDollars,
            legionDenarius: nextLegionDenarius,
            prewarMoney: nextPrewarMoney,
            exchangeRates: {
                ncrDollars: nextRateNcr,
                legionDenarius: nextRateLegion,
                prewarMoney: nextRatePrewar,
            },
            currentLuck: nextCurrentLuck,
        });

        if (hpRemoved >= 5) {
            showToast(t('hpDamageWarningToast'));
        }

        onClose();
    };

    const handleTextNumberChange =
        (setter: (val: string) => void) => (e: { target: { value: string } }) => {
            setter(e.target.value);
        };

    const isFormValid =
        resolvedValues.currentHp !== null &&
        resolvedValues.rads !== null &&
        resolvedValues.currentLuck !== null &&
        resolvedValues.caps !== null &&
        resolvedValues.ncrDollars !== null &&
        resolvedValues.legionDenarius !== null &&
        resolvedValues.prewarMoney !== null &&
        resolvedValues.rateNcr !== null &&
        resolvedValues.rateLegion !== null &&
        resolvedValues.ratePrewar !== null;

    if (!character) {
        return null;
    }

    // Currency data for table rendering
    const currencies = [
        { id: 'caps', icon: 'caps', value: capsInput, setter: setCapsInput, rate: null, rateSetter: null },
        {
            id: 'ncrDollars',
            icon: 'ncrDollars',
            value: ncrDollarsInput,
            setter: setNcrDollarsInput,
            rate: rateNcrInput,
            rateSetter: setRateNcrInput,
        },
        {
            id: 'legionDenarius',
            icon: 'legionDenarius',
            value: legionDenariusInput,
            setter: setLegionDenariusInput,
            rate: rateLegionInput,
            rateSetter: setRateLegionInput,
        },
        {
            id: 'prewarMoney',
            icon: 'prewarMoney',
            value: prewarMoneyInput,
            setter: setPrewarMoneyInput,
            rate: ratePrewarInput,
            rateSetter: setRatePrewarInput,
        },
    ];

    return (
        <BasePopup
            title="edit"
            onConfirm={onConfirm}
            onClose={onClose}
            confirmDisabled={!isFormValid}
        >
            <hr />

            {/* HP, Rads & Luck Section */}
            <table>
                <tbody>
                    {/* HP Row */}
                    <tr>
                        <th scope="row">
                            <div className={"row"}>
                                <div
                                    className="themed-svg icon-m"
                                    data-icon="hp"
                                />
                                HP
                            </div>
                        </th>
                        <td>
                            <input
                                type="text"
                                inputMode="decimal"
                                className="header-info-popup__stat-input"
                                value={currentHpInput}
                                onChange={handleTextNumberChange(setCurrentHpInput)}
                                min="0"
                                max={effectiveMaxHp}
                            />
                            <span className="header-info-popup__stat-max">
                                &nbsp;/ {effectiveMaxHp}
                            </span>
                        </td>
                        <td>
                            <i
                                className="fas fa-radiation header-info-popup__stat-input text-warning"
                                title={t('radiation')}
                            />
                            <input
                                type="text"
                                inputMode="decimal"
                                className="header-info-popup__stat-input border-warning"
                                value={radsInput}
                                onChange={handleTextNumberChange(setRadsInput)}
                                min="0"
                                max={character.maxHp}
                                title={t('radiation')}
                            />
                        </td>
                    </tr>
                    {/* Luck Row */}
                    <tr>
                        <th scope="row">
                            <div className={"row"}>
                                <div
                                    className="themed-svg icon-m"
                                    data-icon="luck"
                                />
                                {t('luck')}
                            </div>
                        </th>
                        <td>
                            <input
                                type="text"
                                inputMode="decimal"
                                className="header-info-popup__stat-input"
                                value={currentLuckInput}
                                onChange={handleTextNumberChange(setCurrentLuckInput)}
                                min="0"
                                max={character.maxLuck}
                            />
                            <span className="header-info-popup__stat-max">
                                &nbsp;/ {character.maxLuck}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <hr />

            {/* Currency Section */}
            <section>
                <span>{t('currency')}</span>

                <table className="header-info-popup__currency-table">
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
                                <div className="row">
                                    <div
                                        className="themed-svg icon-l"
                                        data-icon={currency.icon}
                                    />
                                    <span className="header-info-popup__currency-label">
                                        {t(currency.id)}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="header-info-popup__stat-input"
                                    value={currency.value}
                                    onChange={handleTextNumberChange(currency.setter)}
                                    min="0"
                                />
                            </td>
                            <td>
                                <div className="header-info-popup__rate-cell">
                                    {currency.rateSetter ? (
                                        <>
                                            <input
                                                type="number"
                                                className="header-info-popup__rate-input"
                                                value={currency.rate}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    width: '2rem',
                                                }}
                                                onChange={handleTextNumberChange(currency.rateSetter)}
                                                min="0.1"
                                                step="0.1"
                                            />
                                            <span className="header-info-popup__rate-fixed">
                                                    &nbsp;: 1
                                                </span>
                                        </>
                                    ) : (
                                        <span className="header-info-popup__rate-fixed">
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
                <div className="header-info-popup__total">
                    <span className="header-info-popup__total-label">{t('total')}:</span>
                    <span className="header-info-popup__total-value">
                        {totalCapsEquivalent}
                    </span>
                    <div
                        className="themed-svg icon-s"
                        data-icon="caps"
                    />
                </div>
            </section>
        </BasePopup>
    );
}

export default AppHeaderPopup
