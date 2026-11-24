import React, { useMemo, useState } from 'react';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useTranslation } from 'react-i18next';
import { DEFAULT_EXCHANGE_RATES } from '@/types';
import BasePopup from '@/app/components/popup/common/BasePopup.tsx';
import { usePopup } from '@/app/contexts/PopupContext.tsx';

type FormFields = {
    currentHp: string;
    rads: string;
    maxHpBonus: string;
    currentLuck: string;
    caps: string;
    ncrDollars: string;
    legionDenarius: string;
    prewarMoney: string;
    rateNcr: string;
    rateLegion: string;
    ratePrewar: string;
};

const SIGNED_INT_REGEX = /^[+-]?\d+$/;
const POSITIVE_RATE_REGEX = /^\d+(\.\d+)?$/;

function resolveNumber(raw: string, baseVal: number, minVal = 0, maxVal = Infinity): number {
    let value: number;
    if (['', '+', '-', '.'].includes(raw)) {
        value = baseVal;
    } else if (/^\d/.test(raw)) {
        value = Number(raw);
    } else {
        // Starts with '+' or '-' -> relative delta from baseVal
        value = baseVal + Number(raw);
    }
    return Math.max(minVal, Math.min(value, maxVal));
}

interface DeltaInputProps {
    value: string;
    baseValue: number;
    min?: number;
    max?: number;
    className?: string;
    smaller?: boolean;
    title?: string;
    onChangeValue: (val: string) => void;
}

function DeltaNumberInput({
    value,
    baseValue,
    min = 0,
    max = Infinity,
    className = 'header-info-popup__stat-input',
    smaller = false,
    title,
    onChangeValue,
}: Readonly<DeltaInputProps>) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = e.target.value.replace(/^ /, '+');
        // Allow leading '+' or '-' followed by digits only
        const filtered = normalized.replace(/(?!^[+-])\D/g, '');
        onChangeValue(filtered);
    };

    const handleFocus = () => {
        const resolved = resolveNumber(value, baseValue, min, max);
        const delta = resolved - baseValue;
        onChangeValue(delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}` : `${baseValue}`);
    };

    const handleBlur = () => {
        const resolved = resolveNumber(value, baseValue, min, max);
        onChangeValue(`${resolved}`);
    };

    return (
        <input
            {...(smaller ? { style: { maxWidth: '2.5rem', minWidth: '2rem' } } : {})}
            type="text"
            inputMode="numeric"
            className={className}
            value={value}
            title={title}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
        />
    );
}

/**
 * StatAdjustmentPopup - Allows editing HP, Max HP Bonus, Rads, Luck, and currencies
 */
function AppHeaderPopup({ onClose }: Readonly<{ onClose: () => void }>) {
    const { t } = useTranslation();
    const { character, updateCharacter } = useCharacter();
    const { showToast } = usePopup();

    const baseMaxHpBonus = character.maxHpBonus ?? 0;

    const [form, setForm] = useState<FormFields>(() => ({
        currentHp: `${character.currentHp}`,
        rads: `${character.rads}`,
        maxHpBonus: `${baseMaxHpBonus}`,
        currentLuck: `${character.currentLuck}`,
        caps: `${character.caps}`,
        ncrDollars: `${character.ncrDollars}`,
        legionDenarius: `${character.legionDenarius}`,
        prewarMoney: `${character.prewarMoney}`,
        rateNcr: `${character.exchangeRates.ncrDollars}`,
        rateLegion: `${character.exchangeRates.legionDenarius}`,
        ratePrewar: `${character.exchangeRates.prewarMoney}`,
    }));

    const setField = (key: keyof FormFields) => (val: string) =>
        setForm(prev => ({ ...prev, [key]: val }));

    // Minimum allowed bonus prevents total un-irradiated Max HP from dropping below 1
    const minMaxHpBonus = -(character.maxHp - 1);

    const resolvedValues = useMemo(() => {
        const maxHpBonus = resolveNumber(form.maxHpBonus, baseMaxHpBonus, minMaxHpBonus);
        const grossMaxHp = character.maxHp + maxHpBonus;
        const rads = resolveNumber(form.rads, character.rads, 0, Math.max(0, grossMaxHp - 1));
        const maxHp = Math.max(1, grossMaxHp - rads);

        return {
            hp: resolveNumber(form.currentHp, character.currentHp, 0, maxHp),
            maxHp,
            maxHpBonus,
            rads,
            luck: resolveNumber(form.currentLuck, character.currentLuck, 0, character.maxLuck),

            caps: resolveNumber(form.caps, character.caps),
            ncrDollars: resolveNumber(form.ncrDollars, character.ncrDollars),
            legionDenarius: resolveNumber(form.legionDenarius, character.legionDenarius),
            prewarMoney: resolveNumber(form.prewarMoney, character.prewarMoney),

            rateNcr: resolveNumber(form.rateNcr, character.exchangeRates.ncrDollars, 0.1),
            rateLegion: resolveNumber(form.rateLegion, character.exchangeRates.legionDenarius, 0.1),
            ratePrewar: resolveNumber(form.ratePrewar, character.exchangeRates.prewarMoney, 0.1),
        };
    }, [form, character, baseMaxHpBonus, minMaxHpBonus]);

    const isFormValid = useMemo(() => {
        const intFieldsValid = [
            form.currentHp,
            form.rads,
            form.maxHpBonus,
            form.currentLuck,
            form.caps,
            form.ncrDollars,
            form.legionDenarius,
            form.prewarMoney,
        ].every(v => SIGNED_INT_REGEX.test(v));

        const rateFieldsValid = [form.rateNcr, form.rateLegion, form.ratePrewar].every(
            v => POSITIVE_RATE_REGEX.test(v) && Number(v) >= 0.1,
        );

        return intFieldsValid && rateFieldsValid;
    }, [form]);

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
    }, [resolvedValues]);

    const onConfirm = () => {
        if (!isFormValid) { return; }

        const hpRemoved = character.currentHp - resolvedValues.hp;

        updateCharacter({
            currentHp: resolvedValues.hp,
            rads: resolvedValues.rads,
            maxHpBonus: resolvedValues.maxHpBonus,
            currentLuck: resolvedValues.luck,
            caps: resolvedValues.caps,
            ncrDollars: resolvedValues.ncrDollars,
            legionDenarius: resolvedValues.legionDenarius,
            prewarMoney: resolvedValues.prewarMoney,
            exchangeRates: {
                ncrDollars: resolvedValues.rateNcr,
                legionDenarius: resolvedValues.rateLegion,
                prewarMoney: resolvedValues.ratePrewar,
            },
        });

        if (hpRemoved >= 5) {
            showToast(t('hpDamageWarningToast'));
        }

        onClose();
    };

    const handleRateChange = (key: 'rateNcr' | 'rateLegion' | 'ratePrewar', raw: string) => {
        let filtered = raw.replace(/[^\d.]/g, '');
        const parts = filtered.split('.');
        if (parts.length >= 2) {
            filtered = `${parts[0]}.${parts.slice(1).join('').slice(0, 1)}`;
        }
        setField(key)(filtered);
    };

    const handleRateBlur = (key: 'rateNcr' | 'rateLegion' | 'ratePrewar', baseRate: number) => {
        const resolved = resolveNumber(form[key], baseRate, 0.1);
        setField(key)(`${resolved}`);
    };

    const currencies = [
        {
            id: 'caps',
            field: 'caps' as const,
            currentValue: character.caps,
            rateField: null,
            currentRate: 1,
        },
        {
            id: 'ncrDollars',
            field: 'ncrDollars' as const,
            currentValue: character.ncrDollars,
            rateField: 'rateNcr' as const,
            currentRate: character.exchangeRates.ncrDollars,
        },
        {
            id: 'legionDenarius',
            field: 'legionDenarius' as const,
            currentValue: character.legionDenarius,
            rateField: 'rateLegion' as const,
            currentRate: character.exchangeRates.legionDenarius,
        },
        {
            id: 'prewarMoney',
            field: 'prewarMoney' as const,
            currentValue: character.prewarMoney,
            rateField: 'ratePrewar' as const,
            currentRate: character.exchangeRates.prewarMoney,
        },
    ];

    return (
        <BasePopup
            title={t('edit')}
            onConfirm={onConfirm}
            onClose={onClose}
            confirmDisabled={!isFormValid}
        >
            <hr />

            {/* HP, Max HP Bonus, Rads & Luck Section */}
            <table>
                <tbody>
                    {/* HP Row */}
                    <tr>
                        <th scope="row">
                            <div className="row">
                                <div className="themed-svg icon-m" data-icon="hp" />
                                HP
                            </div>
                        </th>
                        <td>
                            <DeltaNumberInput
                                value={form.currentHp}
                                baseValue={character.currentHp}
                                min={0}
                                max={resolvedValues.maxHp}
                                smaller={true}
                                onChangeValue={setField('currentHp')}
                            />
                            <span className="header-info-popup__stat-max">
                                &nbsp;/ {resolvedValues.maxHp}
                            </span>
                        </td>
                        <td>
                            <i
                                className="fas fa-heart-circle-plus header-info-popup__stat-input text-success"
                                title={t('maxHpBonus')}
                            />
                            <DeltaNumberInput
                                className="header-info-popup__stat-input border-success"
                                value={form.maxHpBonus}
                                baseValue={baseMaxHpBonus}
                                min={minMaxHpBonus}
                                smaller={true}
                                title={t('maxHpBonus')}
                                onChangeValue={setField('maxHpBonus')}
                            />
                        </td>
                        <td>
                            <i
                                className="fas fa-radiation header-info-popup__stat-input text-warning"
                                title={t('radiation')}
                            />
                            <DeltaNumberInput
                                className="header-info-popup__stat-input border-warning"
                                value={form.rads}
                                baseValue={character.rads}
                                min={0}
                                max={Math.max(0, character.maxHp + resolvedValues.maxHpBonus - 1)}
                                smaller={true}
                                title={t('radiation')}
                                onChangeValue={setField('rads')}
                            />
                        </td>
                    </tr>

                    {/* Luck Row */}
                    <tr>
                        <th scope="row">
                            <div className="row">
                                <div className="themed-svg icon-m" data-icon="luck" />
                                {t('luck')}
                            </div>
                        </th>
                        <td>
                            <DeltaNumberInput
                                value={form.currentLuck}
                                baseValue={character.currentLuck}
                                min={0}
                                max={character.maxLuck}
                                smaller={true}
                                onChangeValue={setField('currentLuck')}
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
                                            data-icon={currency.id}
                                        />
                                        <span className="header-info-popup__currency-label">
                                            {t(currency.id)}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <DeltaNumberInput
                                        value={form[currency.field]}
                                        baseValue={currency.currentValue}
                                        min={0}
                                        onChangeValue={setField(currency.field)}
                                    />
                                </td>
                                <td>
                                    <div className="header-info-popup__rate-cell">
                                        {currency.rateField ? (
                                            <>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="header-info-popup__rate-input"
                                                    value={form[currency.rateField]}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        width: '2rem',
                                                    }}
                                                    onChange={e =>
                                                        handleRateChange(
                                                            currency.rateField,
                                                            e.target.value,
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        handleRateBlur(
                                                            currency.rateField,
                                                            currency.currentRate,
                                                        )
                                                    }
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
                    <span className="header-info-popup__total-value">{totalCapsEquivalent}</span>
                    <div className="themed-svg icon-s" data-icon="caps" />
                </div>
            </section>
        </BasePopup>
    );
}

export default AppHeaderPopup;
