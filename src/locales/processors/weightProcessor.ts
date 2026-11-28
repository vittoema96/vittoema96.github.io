import { UISettingsManager, WeightUnit } from '@/services/UISettingsManager.ts';
import i18next, { PostProcessorModule } from 'i18next';

/**
 * Weights in descriptions are written as `[[wt:N]]`, where N is in the app's internal kg scale
 * (the same value stored in the CSV data). At render time the token is shown in the weight unit
 * chosen in the settings: kg is shown as-is, lb is N x 2 (the halved-weight rule).
 */
const WEIGHT_TOKEN = /\[\[wt:(\d+(?:\.\d+)?)]]/g;

const formatWeightNumber = (value: number, lang: string): string =>
    new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value);

export const formatWeightToken = (internalWeight: number, unit: WeightUnit, lang: string): string => {
    if (unit === 'kg') {
        return `${formatWeightNumber(internalWeight, lang)}kg`;
    }
    return `${formatWeightNumber(internalWeight * 2, lang)}lb`;
};

export const weightProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'weightTokens',
    process: (value, _key, options) => {
        if (typeof value !== 'string' || !value.includes('[[wt:')) {
            return value;
        }
        const lang = (options?.lng as string | undefined) ?? i18next.language;
        const unit = UISettingsManager.getCurrentWeightUnit();
        return value.replace(WEIGHT_TOKEN, (_match, kg: string) =>
            formatWeightToken(Number(kg), unit, lang),
        );
    },
};
