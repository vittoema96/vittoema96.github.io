import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originNightkin: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'nightkin' as const,
    // TODO add a dedicated Nightkin SVG.
    needsSpecializedArmor: true,
};

export default originNightkin;
