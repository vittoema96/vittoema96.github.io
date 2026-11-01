export function sortByLocalizedLabel<T>(
    values: readonly T[],
    t: (key: string) => string,
    getKey: (value: T) => string = String,
): T[] {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
    return [...values].sort((a, b) => collator.compare(t(getKey(a)), t(getKey(b))));
}
