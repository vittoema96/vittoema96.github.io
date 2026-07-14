import { RawCharacter } from '@/types';
import { Origin, OriginId } from '@/features/character/origin.ts';
import { useMemo } from 'react';
import { traits } from '@/data';
import { hasFeat } from '@/features/character/feats/utils.ts';

// Trait data from CSV
export interface TraitData {
    ID: TraitId;
    EFFECTS: string[];
    ORIGINS: OriginId[];
    FIXED: boolean;
}
export type TraitId = keyof typeof traits

function getFixedTraits(originId: OriginId): TraitId[]{
    if (originId){
        return Object.values(traits)
            .filter(trait => {
                return trait.FIXED && trait.ORIGINS.includes(originId);
            })
            .map(trait => trait.ID as TraitId);
    } else {
        return [];
    }
}

function filterTraits(traitsList: TraitId[], originId: OriginId) {
    return traitsList.filter(trait => {
        return originId && traits[trait]?.ORIGINS.includes(originId);
    });
}

export function useTraits(raw: RawCharacter, origin: Origin){
    return useMemo(
        () => {
            // Get fixed traits from database where FIXED === true AND ORIGINS includes current origin
            const fixedTraits = getFixedTraits(origin.id);

            // Filter user-selected traits to only include those valid for this origin
            const userTraits = filterTraits(raw.traits, origin.id);

            // Combine and deduplicate
            return [...new Set([...fixedTraits, ...userTraits])];
        },
        [raw.traits, origin.id])
}


export function hasTrait(traits: TraitId[], trait: TraitId){
    return hasFeat(traits, trait);
}
