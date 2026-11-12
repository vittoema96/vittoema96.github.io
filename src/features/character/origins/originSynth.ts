import { BODY_PARTS } from '@/types';
import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originSynth: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'synth' as const,
    // TODO when implementing consumables usage,
    //  prevent consumable effects from being applied.
    bodyParts: BODY_PARTS,
    isRobot: false,
    // TODO add a dedicated Synth SVG.
};

export default originSynth;
