import { Character, RawCharacter } from '@/types';
import { useMemo } from 'react';
import { createDefaultCompanion } from '@/utils/companionTypes';
import { getOriginById } from '@/features/character/origin.ts';
import { SkillType, useSkills } from '@/features/character/skills/skills.ts';
import { useSpecial } from '@/features/character/special/special.ts';
import { TraitId, useTraits } from '@/features/character/feats/traits/traits.ts';
import { PerkId, usePerks } from '@/features/character/feats/perks/perks.ts';
import { useSpecialties } from '@/features/character/specialties.ts';
import { useMaxHp } from '@/features/character/hp.ts';
import { useCurrentWeight, useMaxWeight } from '@/features/character/weight.ts';
import { useDamageResistances } from '@/features/character/damageResistances.ts';

function useCalculatedCharacter(raw: RawCharacter): Character {
    // TODO init exchange rates
    const exchangeRates = raw.exchangeRates;

    const origin = useMemo(() => getOriginById(raw.origin), [raw.origin]);
    const traits: TraitId[] = useTraits(raw, origin);
    const perks: PerkId[] = usePerks(raw);

    const specialties: SkillType[] = useSpecialties(raw, origin, traits);

    const special = useSpecial(raw);
    const skills = useSkills(raw, specialties, origin);

    const maxHp = useMaxHp(raw, special, perks);
    const rads = Math.min(raw.rads, maxHp);
    const effectiveMaxHp = maxHp - rads;
    const currentHp = Math.min(raw.currentHp ?? effectiveMaxHp, effectiveMaxHp);

    const maxWeight = useMaxWeight(raw, origin, perks, traits);
    const currentWeight = useCurrentWeight(raw, perks);

    const maxLuck = useMemo(() => {
        let result = raw.special.luck;
        if (traits.includes('traitGifted')) {
            result -= 1;
        }
        return result;
    }, [raw.special.luck, traits]);
    const currentLuck = Math.min(raw.currentLuck ?? maxLuck, maxLuck);

    const defense = useMemo(() => {
        return raw.special.agility < 9 ? 1 : 2;
    }, [raw.special.agility]);

    const initiative = useMemo(() => {
        return raw.special.agility + raw.special.perception;
    }, [raw.special.agility, raw.special.perception]);

    const meleeDamage = useMemo(() => {
        let base = 0;
        if (raw.special.strength >= 7) {
            base = 1;
        }
        if (raw.special.strength >= 9) {
            base = 2;
        }
        if (raw.special.strength >= 11) {
            base = 3;
        }
        if (traits.includes('traitHeavyHanded')) {
            base += 1;
        }
        return base;
    }, [raw.special.strength, traits]);

    const locationsDR = useDamageResistances(raw, origin);

    // Default companion (Eyebot)
    // TODO CRITICAL: This should check the current companion, not default to eyebot!
    const companion = useMemo(() => {
        if (raw.companion) {
            return raw.companion;
        }
        // Return default eyebot companion
        return createDefaultCompanion('eyebot');
    }, [raw.companion]);

    return {
        // Passthrough (with defaults) values
        name: raw.name,
        background: raw.background,
        currentHp,
        rads,
        currentLuck,
        caps: raw.caps,
        ncrDollars: raw.ncrDollars,
        legionDenarius: raw.legionDenarius,
        prewarMoney: raw.prewarMoney,
        exchangeRates,
        items: raw.items,
        customItems: raw.customItems,
        level: raw.level,
        specialties,
        traits,
        perks,
        mapCodes: raw.mapCodes,
        companion,

        // Calculated values
        origin,
        maxHp,
        maxLuck,
        maxWeight,
        currentWeight,
        special,
        skills,
        defense,
        initiative,
        meleeDamage,
        locationsDR,
    };
}

export default useCalculatedCharacter;
