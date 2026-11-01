import { useSyncExternalStore } from 'react';
import { UISettingsManager, type MapRegion } from '@/services/UISettingsManager';

export function useMapRegion(): MapRegion {
    return useSyncExternalStore(UISettingsManager.subscribe, UISettingsManager.getCurrentRegion);
}
