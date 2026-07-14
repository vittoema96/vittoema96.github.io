export function hasFeat<T>(feats: T[], feat: T) {
    return feats.includes(feat);
}

export function featCount<T>(feats: T[], feat: T) {
    return feats.filter(f => f === feat).length;
}
