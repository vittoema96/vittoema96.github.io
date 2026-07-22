import { RawCharacter } from '@/types';
import { useMemo } from 'react';
import { perks } from '@/data';
import { SPECIAL, SpecialType } from '@/features/character/special/special.ts';
import { featCount, hasFeat } from '@/features/character/feats/utils.ts';
import perksJson from '@/data/perks.json';


type PerkRequirementKey = SpecialType | 'level';
export type PerkRequirements = Partial<Record<PerkRequirementKey, number>> &
    Record<string, number | undefined>;
export type PerkId = keyof typeof perksJson;
export type PerkData = {
    ID: PerkId;
    REQUISITES: PerkRequirements;
} & (
    | {
          TIER: 1;
          LEVEL_REQ_INCREASE: null;
      }
    | {
          TIER: number;
          LEVEL_REQ_INCREASE: number;
      }
);


function filterPerks(perkList: PerkId[], level: number, special: Record<SpecialType, number>) {
    const map = perkList.reduce(
        (acc, perk) => {
            acc[perk] = (acc[perk] ?? 0) + 1;
            return acc;
        },
        {} as Record<PerkId, number>,
    );

    return perkList.filter(perk => {
        const perkData = perks[perk]!;
        const perkRank = map[perk] ?? 0;
        const requisites = perkData.REQUISITES as Partial<
            Record<SpecialType | 'level', number | string>
        >;
        const levelRequisite = Number(requisites.level);
        const meetsLevelRequisites =
            !levelRequisite ||
            levelRequisite + Number(perkData.LEVEL_REQ_INCREASE) * (perkRank - 1) <= level;
        const meetsSpecialRequisites = SPECIAL.every(stat => {
            const specialRequisite = Number(requisites[stat]);
            return !specialRequisite || special[stat] >= specialRequisite;
        });

        return meetsLevelRequisites && meetsSpecialRequisites;
    });
}

export function usePerks(raw: RawCharacter) {
    return useMemo(
        () => filterPerks(raw.perks, raw.level, raw.special),
        [raw.perks, raw.special, raw.level],
    );
}

export function hasPerk(input: PerkId[], perk: PerkId) {
    return hasFeat(input, perk);
}

export function perkRank(input: PerkId[], perk: PerkId) {
    return featCount(input, perk);
}
