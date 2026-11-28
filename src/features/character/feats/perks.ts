import { RawCharacter } from '@/types';
import { perks } from '@/data';
import { SPECIAL, SpecialMap, SpecialType } from '@/features/character/special/special.ts';
import perksJson from '@/data/perks.json';
import type { Origin } from '@/features/character/origins/types.ts';
import { getOriginById } from '@/features/character/origins/registry.ts';
import { getFixedTraits } from '@/features/character/feats/traits.ts';
import { getActiveFeats } from '@/features/character/feats/registry.ts';

type PerkRequirementKey = SpecialType | 'level';

/** Requirements beyond SPECIAL and level, written in REQUISITES as `"notRobot": true`. */
export const PERK_FLAG_REQUIREMENTS = [
    'notRobot',
    'notGhoul',
    'notRadiationImmune',
    'noCompanion',
] as const;
export type PerkFlagRequirement = (typeof PERK_FLAG_REQUIREMENTS)[number];

export type PerkRequirements = Partial<Record<PerkRequirementKey, number>> &
    Partial<Record<PerkFlagRequirement, boolean>>;
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

/** Radiation immunity granted by the origin itself or by its fixed traits. */
function hasOriginRadiationImmunity(origin: Origin): boolean {
    // TODO Verify that radiation immunity only ever comes from the origin and its fixed traits
    //  (true as of 2026-11-28). If a perk or a selectable trait ever grants it, this check misses it.
    return (
        origin.hasRadiationImmunity ||
        getActiveFeats({ perks: [], traits: getFixedTraits(origin.id), origin }).some(feat =>
            feat.isRadiationImmune?.(),
        )
    );
}

/**
 * Flag requirements of `perk` that the character does not meet.
 * `noCompanion` is only checked when `hasCompanion` is given, i.e. when the perk is being taken:
 * a companion gained later does not switch an owned perk off.
 */
export function getUnmetPerkFlags(
    perk: PerkId,
    origin: Origin,
    hasCompanion?: boolean,
): PerkFlagRequirement[] {
    const requisites = (perks[perk]?.REQUISITES ?? {}) as PerkRequirements;
    return PERK_FLAG_REQUIREMENTS.filter(flag => {
        if (!requisites[flag]) {
            return false;
        }
        switch (flag) {
            case 'notRobot':
                return origin.isRobot;
            case 'notGhoul':
                return origin.id === 'ghoul';
            case 'notRadiationImmune':
                return hasOriginRadiationImmunity(origin);
            case 'noCompanion':
                return hasCompanion === true;
        }
    });
}

function filterPerks(perkList: PerkId[], level: number, special: SpecialMap, origin: Origin) {
    // Each copy of a perk is one rank: the n-th copy checks the level requirement of rank n,
    // so a level that is too low only drops the ranks above it.
    const seen: Partial<Record<PerkId, number>> = {};

    return perkList.filter(perk => {
        const perkData = perks[perk]!;
        const perkRank = (seen[perk] = (seen[perk] ?? 0) + 1);
        const requisites = perkData.REQUISITES as Partial<
            Record<SpecialType | 'level', number | string>
        >;
        const levelRequisite =
            (Number(requisites.level) || 0) +
            (Number(perkData.LEVEL_REQ_INCREASE) || 0) * (perkRank - 1);
        const meetsLevelRequisites = levelRequisite <= level;
        const meetsSpecialRequisites = SPECIAL.every(stat => {
            const specialRequisite = Number(requisites[stat]);
            return !specialRequisite || special[stat] >= specialRequisite;
        });

        const meetsFlagRequisites = getUnmetPerkFlags(perk, origin).length === 0;

        return meetsLevelRequisites && meetsSpecialRequisites && meetsFlagRequisites;
    });
}

export function calculatePerks(raw: RawCharacter) {
    return filterPerks(raw.perks, raw.level, raw.special, getOriginById(raw.origin));
}
