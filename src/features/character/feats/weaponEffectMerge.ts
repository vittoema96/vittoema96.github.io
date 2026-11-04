export interface WeaponEffect {
    effect: string;
    level?: number | undefined;
    bonus?: number | undefined;
}

export function mergeWeaponEffects(
    effects: readonly string[],
    bonusEffects: readonly string[],
): WeaponEffect[] {
    const effectsDict: Record<string, WeaponEffect> = {};

    // TODO distinguish ranked effects from effects without a level.
    for (const entry of effects) {
        const [effect, rawLevel] = entry.split(':');
        if (!effect) {
            continue;
        }

        const level = rawLevel ? Number.parseInt(rawLevel, 10) || 1 : undefined;
        effectsDict[effect] = {
            effect,
            ...(level ? { level, bonus: 0 } : {}),
        };
    }

    for (const entry of bonusEffects) {
        const [effect, rawLevel] = entry.split(':');
        if (!effect) {
            continue;
        }

        const level = rawLevel ? Number.parseInt(rawLevel, 10) || 1 : undefined;
        const existing = effectsDict[effect];
        if (!existing) {
            effectsDict[effect] = {
                effect,
                ...(level ? { level: 0, bonus: level } : {}),
            };
        } else {
            // TODO define how unranked bonuses should combine with ranked effects.
            existing.bonus = (existing.bonus ?? 0) + (level ?? 1);
        }
    }

    return Object.values(effectsDict);
}
