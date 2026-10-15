import { BODY_PARTS } from '@/types';
import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originSynth: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'synth' as const,
    // TODO implement the remaining Synth mechanics.
    bodyParts: BODY_PARTS,
    isRobot: true,
    // TODO add a dedicated Synth SVG.
};

export default originSynth;
