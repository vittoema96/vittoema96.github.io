import type { WeightUnit } from '@/services/UISettingsManager.ts';

const LB_PER_KG = 2;

export function convertWeight(value: number, unit: WeightUnit): number {
    return unit === 'lb' ? value * LB_PER_KG : value;
}

export function formatWeight(value: number, unit: WeightUnit): string {
    const converted = convertWeight(value, unit);
    return `${Number(converted.toFixed(1))}`;
}

export function parseDisplayedWeight(value: number, unit: WeightUnit): number {
    return unit === 'lb' ? value / LB_PER_KG : value;
}
