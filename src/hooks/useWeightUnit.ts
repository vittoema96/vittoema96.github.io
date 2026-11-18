import { useSyncExternalStore } from 'react';
import { UISettingsManager, type WeightUnit } from '@/services/UISettingsManager.ts';

export function useWeightUnit(): WeightUnit {
    return useSyncExternalStore(
        UISettingsManager.subscribe,
        UISettingsManager.getCurrentWeightUnit,
    );
}
