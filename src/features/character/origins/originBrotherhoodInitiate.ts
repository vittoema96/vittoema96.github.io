import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { SkillType } from '@/features/character/skills/skills.ts';
import type { Origin } from './types.ts';

const originBrotherhoodInitiate: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'brotherhoodInitiate' as const,
    getSpecialtySkillBonuses: () => [{
        bonus: 1,
        skills: ['energyWeapons', 'science', 'repair'] as SkillType[],
    }],
};

export default originBrotherhoodInitiate;
