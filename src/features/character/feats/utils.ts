import type { PerkId } from './perks.ts';
import type { TraitId } from './traits.ts';

export function hasFeat<T>(feats: T[], feat: T) {
    return feats.includes(feat);
}

export function featCount<T>(feats: T[], feat: T) {
    return feats.filter(f => f === feat).length;
}

export function hasPerk(input: PerkId[], perk: PerkId) {
    return hasFeat(input, perk);
}

export function perkRank(input: PerkId[], perk: PerkId) {
    return featCount(input, perk);
}

export function hasTrait(input: TraitId[], trait: TraitId) {
    return hasFeat(input, trait);
}
