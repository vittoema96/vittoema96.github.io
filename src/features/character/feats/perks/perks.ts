import { RawCharacter } from '@/types';
import { useMemo } from 'react';
import { perks } from '@/data'
import { SPECIAL, SpecialType } from '@/features/character/special/special.ts';
import { featCount, hasFeat } from '@/features/character/feats/utils.ts';

export type PerkId = keyof typeof perks

function filterPerks(perkList: PerkId[], level: number, special: Record<SpecialType, number>){
    const map = perkList.reduce((acc, perk) => {
        acc[perk] = (acc[perk] ?? 0) + 1
        return acc
    }, {} as Record<PerkId, number>)

    return perkList.filter((perk) => {
        const perkData = perks[perk]!;
        const perkRank = map[perk] ?? 0;
        const requisites = perkData.REQUISITES as Partial<Record<SpecialType | 'level', number | string>>
        const levelRequisite = Number(requisites.level)
        const meetsLevelRequisites = !levelRequisite || (
            levelRequisite + Number(perkData.LEVEL_REQ_INCREASE) * (perkRank - 1) <= level
        )
        const meetsSpecialRequisites = SPECIAL.every(stat => {
            const specialRequisite = Number(requisites[stat])
            return !specialRequisite || special[stat] >= specialRequisite
        })

        return meetsLevelRequisites && meetsSpecialRequisites
    })
}

export function usePerks(raw: RawCharacter){
    return useMemo(
        () => filterPerks(raw.perks, raw.level, raw.special),
        [raw.perks, raw.special, raw.level]
    )
}

export function hasPerk(perks: PerkId[], perk: PerkId){
    return hasFeat(perks, perk)
}

export function perkRank(perks: PerkId[], perk: PerkId){
    return featCount(perks, perk)
}
