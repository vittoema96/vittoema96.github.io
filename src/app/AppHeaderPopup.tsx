import React, { useMemo, useState } from 'react';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useTranslation } from 'react-i18next';
import { DEFAULT_EXCHANGE_RATES } from '@/types';
import BasePopup from '@/app/components/popup/common/BasePopup.tsx';
import { usePopup } from '@/app/contexts/PopupContext.tsx';

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

    const resolve = (val: string, currentVal: number, maxVal: number = Infinity) => {
        let value;
        if(['', '+', '-', '.'].includes(val)){
            value = 0
        } else if (new RegExp(/^\d/).exec(val)) {
            value = Number(val)
        } else {
            value = currentVal + Number(val)
        }
        return Math.max(0, Math.min(value, maxVal))
    }

    const resolvedValues = useMemo(
        () => {
            const rads = resolve(radsInput, character.rads, character.maxHp)
            const maxHp = character.maxHp-rads
            return {
                hp: resolve(currentHpInput, character.currentHp, maxHp),
                maxHp,
                rads,
                luck: resolve(currentLuckInput, character.currentLuck, character.maxLuck),

                caps: resolve(capsInput, character.caps),
                ncrDollars: resolve(ncrDollarsInput, character.ncrDollars),
                legionDenarius: resolve(legionDenariusInput, character.legionDenarius),
                prewarMoney: resolve(prewarMoneyInput, character.prewarMoney),

                rateNcr: resolve(rateNcrInput, character.exchangeRates.ncrDollars),
                rateLegion: resolve(rateLegionInput, character.exchangeRates.legionDenarius),
                ratePrewar: resolve(ratePrewarInput, character.exchangeRates.prewarMoney),
            }
        },
        [currentHpInput, character.currentHp, character.rads, character.maxHp, character.currentLuck, character.maxLuck, character.caps, character.ncrDollars, character.legionDenarius, character.prewarMoney, character.exchangeRates.ncrDollars, character.exchangeRates.legionDenarius, character.exchangeRates.prewarMoney, radsInput, currentLuckInput, capsInput, ncrDollarsInput, legionDenariusInput, prewarMoneyInput, rateNcrInput, rateLegionInput, ratePrewarInput]
    );


    // Calculate total wealth in caps equivalent
    const totalCapsEquivalent = useMemo(() => {
        const ncrRate = resolvedValues.rateNcr || DEFAULT_EXCHANGE_RATES.ncrDollars;
        const legRate = resolvedValues.rateLegion || DEFAULT_EXCHANGE_RATES.legionDenarius;
        const preRate = resolvedValues.ratePrewar || DEFAULT_EXCHANGE_RATES.prewarMoney;

        return (
            resolvedValues.caps +
            Math.floor(resolvedValues.ncrDollars / ncrRate) +
            Math.floor(resolvedValues.legionDenarius / legRate) +
            Math.floor(resolvedValues.prewarMoney / preRate)
        );
    }, [resolvedValues.caps, resolvedValues.legionDenarius, resolvedValues.ncrDollars, resolvedValues.prewarMoney, resolvedValues.rateLegion, resolvedValues.rateNcr, resolvedValues.ratePrewar]);


    const onConfirm = () => {
        if (!isFormValid) {
            return;
        }

        const nextCurrentHp = resolvedValues.hp!;
        const nextRads = resolvedValues.rads!;
        const nextCurrentLuck = resolvedValues.luck!;
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

    const isCompleteSignedInteger = (value: string) => /^[+-]?[\d.]+$/.test(value);

    const isFormValid = useMemo(
        () => {
            return [
                currentHpInput,
                radsInput,
                currentLuckInput,
                capsInput,
                ncrDollarsInput,
                legionDenariusInput,
                prewarMoneyInput,
                rateNcrInput,
                rateLegionInput,
                ratePrewarInput,
            ].every(isCompleteSignedInteger);
        },
        [currentHpInput, radsInput, currentLuckInput, capsInput, ncrDollarsInput, legionDenariusInput, prewarMoneyInput, rateNcrInput, rateLegionInput, ratePrewarInput]
    )


    // Currency data for table rendering
    const currencies = [
        {
            id: 'caps',
            icon: 'caps',
            currentValue: character.caps,
            value: capsInput,
            setter: setCapsInput,
            currentRate: 1,
            rate: null,
            rateSetter: null },
        {
            id: 'ncrDollars',
            icon: 'ncrDollars',
            currentValue: character.ncrDollars,
            value: ncrDollarsInput,
            setter: setNcrDollarsInput,
            currentRate: character.exchangeRates.ncrDollars,
            rate: rateNcrInput,
            rateSetter: setRateNcrInput,
        },
        {
            id: 'legionDenarius',
            icon: 'legionDenarius',
            currentValue: character.legionDenarius,
            value: legionDenariusInput,
            setter: setLegionDenariusInput,
            currentRate: character.exchangeRates.legionDenarius,
            rate: rateLegionInput,
            rateSetter: setRateLegionInput,
        },
        {
            id: 'prewarMoney',
            icon: 'prewarMoney',
            currentValue: character.prewarMoney,
            value: prewarMoneyInput,
            setter: setPrewarMoneyInput,
            currentRate: character.exchangeRates.prewarMoney,
            rate: ratePrewarInput,
            rateSetter: setRatePrewarInput,
        },
    ];

    const onChange =
        (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
            const raw = e.target.value;
            const normalized = raw.replace(/^ /, '+');
            const filtered = normalized.replace(/(?!^[+-])\D/g, '');
            setter(filtered);
        };

    const onRateChange =
        (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
            const raw = e.target.value;
            // Filter unwanted characters
            let filtered = raw.replace(/[^\d.]/g, '');

            // Ensure only the FIRST dot is kept, strip any subsequent dots
            const parts = filtered.split('.');
            if (parts.length >= 2) {
                filtered = parts[0] + '.' + parts.slice(1).join('').slice(0, 1);
            }
            setter(filtered);
        };

    const onBlur =
        (
            e: React.FocusEvent<HTMLInputElement>,
            setter: (val: string) => void,
            currentVal: number,
            options?: {maxVal?: number, minVal?: number}
        ) => {
            const minVal = options?.minVal ?? 0;
            const maxVal = options?.maxVal ?? Infinity;
            const raw = e.target.value;
            const val = ['', '+', '-'].includes(raw) ? `${currentVal}` : raw

            // Timeout so a click on "disabled" confirm doesn't go through
            setTimeout(() => {
                setter(`${Math.max(minVal, resolve(val, currentVal, maxVal))}`);
            }, 50);
        };

    const onFocus =
        (e: React.FocusEvent<HTMLInputElement>, setter: (val: string) => void, currentVal: number) => {
            const newVal = Number(e.target.value);
            const delta = newVal - currentVal;
            if(delta){
                setter(`${delta > 0 ? '+' : ''}${delta}`);
            } else {
                setter(`${currentVal}`);
            }
        };


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
                                onChange={e => onChange(e, setCurrentHpInput)}
                                onBlur={e => onBlur(e, setCurrentHpInput, character.currentHp, {maxVal: resolvedValues.maxHp})}
                                onFocus={e => onFocus(e, setCurrentHpInput, character.currentHp)}
                                min="0"
                                max={resolvedValues.maxHp}
                            />
                            <span className="header-info-popup__stat-max">
                                &nbsp;/ {resolvedValues.maxHp}
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
                                onChange={e => onChange(e, setRadsInput)}
                                onBlur={e => onBlur(e, setRadsInput, character.rads, {maxVal: character.maxHp})}
                                onFocus={e => onFocus(e, setRadsInput, character.rads)}
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
                                onChange={e => onChange(e, setCurrentLuckInput)}
                                onBlur={e => onBlur(e, setCurrentLuckInput, character.currentLuck, {maxVal: character.maxLuck})}
                                onFocus={e => onFocus(e, setCurrentLuckInput, character.currentLuck)}
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
                                    onChange={e => onChange(e, currency.setter)}
                                    onBlur={e => onBlur(e, currency.setter, currency.currentValue)}
                                    onFocus={e => onFocus(e, currency.setter, currency.currentValue)}

                                    min="0"
                                />
                            </td>
                            <td>
                                <div className="header-info-popup__rate-cell">
                                    {currency.rateSetter ? (
                                        <>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className="header-info-popup__rate-input"
                                                value={currency.rate}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    width: '2rem',
                                                }}
                                                onChange={e => onRateChange(e, currency.rateSetter)}
                                                onBlur={e => onBlur(e, currency.rateSetter, currency.currentRate, {minVal: 0.1})}
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
