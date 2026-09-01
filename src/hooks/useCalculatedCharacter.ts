import { Character, RawCharacter } from '@/types';
import { useMemo } from 'react';
import { getOriginById } from '@/features/character/origin.ts';
import { SkillType, calculateSkills, calculateSkillPoints } from '@/features/character/skills/skills.ts';
import { TraitId, calculateTraits } from '@/features/character/feats/traits/traits.ts';
import { PerkId, calculatePerks } from '@/features/character/feats/perks/perks.ts';
import { calculateSpecialties, calculateSpecialtyPoints } from '@/features/character/specialties.ts';
import { calculateCurrentWeight, calculateMaxWeight } from '@/features/character/weight.ts';
import { calculateDamageResistances } from '@/features/character/damageResistances.ts';
import { apparel } from '@/data';
import { calculateMaxHp } from '@/features/character/hp.ts';
import { calculateMaxLuck } from '@/features/character/luck.ts';
import { calculateMeleeDamage } from '@/features/character/meleeDamage.ts';
import { getAvailableCompanions } from '@/features/character/feats';
import { createDefaultCompanion } from '@/utils/companionTypes.ts';
import { calculateSpecialPoints } from '@/features/character/special/special.ts';

function useCalculatedCharacter(raw: RawCharacter): Character {
    return useMemo(() => {
        // TODO init exchange rates
        const level = raw.level
        const exchangeRates = raw.exchangeRates;

        const origin = getOriginById(raw.origin);
        const traits: TraitId[] = calculateTraits(raw, origin);
        const perks: PerkId[] = calculatePerks(raw);

        const specialties: SkillType[] = calculateSpecialties(raw, origin, traits);

        const special = raw.special;
        const skills = calculateSkills(raw, specialties, origin);
        const skillPoints = calculateSkillPoints(special, skills, specialties, level, perks)
        const specialPoints = calculateSpecialPoints(special, origin, perks, traits)
        const specialtyPoints = calculateSpecialtyPoints(specialties, origin, perks, traits)

        const maxHp = calculateMaxHp(special, level, perks);
        const rads = Math.min(raw.rads, maxHp);
        const effectiveMaxHp = maxHp - rads;
        const currentHp = Math.min(raw.currentHp ?? effectiveMaxHp, effectiveMaxHp);

        const maxWeight = calculateMaxWeight(raw, origin, perks, traits);
        const currentWeight = calculateCurrentWeight(raw, perks);

        const maxLuck = calculateMaxLuck(special, traits)

        const currentLuck = Math.min(raw.currentLuck ?? maxLuck, maxLuck);
        const defense = special.agility < 9 ? 1 : 2;
        const initiative = special.agility + special.perception;

        const meleeDamage = calculateMeleeDamage(special, traits)

        const availableCompanions = getAvailableCompanions(perks, traits)
        const companions = availableCompanions.reduce<typeof raw.companions>((
            acc,
            c
        ) => {
            if(raw.companions[c]){
                acc[c] = raw.companions[c]
            }
            return acc;
        }, {})

        const activeId = raw.activeCompanionId
        const targetId = (activeId && availableCompanions.includes(activeId))
            ? activeId
            : availableCompanions[0]
        const companion = targetId
            ? companions[targetId] ?? createDefaultCompanion(targetId)
            : undefined;

        const items = raw.items.flatMap(item => {
            // If it's a robot part, remove it if you should not have it,
            // equip it if you should have it
            if(apparel[item.id]?.CATEGORY === 'robotPart'){
                if (!origin.isRobot || !origin.bodyParts.has(item.id as any)) {
                    return [];
                } else {
                    return {
                        ...item,
                        equipped: true
                    }
                }
            }
            return item
        })


        const locationsDR = calculateDamageResistances(special, items, origin, perks, traits);

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
            items,
            customItems: raw.customItems,
            level,
            traits,
            perks,
            mapCodes: raw.mapCodes,
            companion,
            companions,

            // Calculated values
            origin,
            maxHp,
            maxLuck,
            maxWeight,
            currentWeight,

            special,
            specialPoints,
            skills,
            skillPoints,
            specialties,
            specialtyPoints,

            defense,
            initiative,
            meleeDamage,
            locationsDR,
        };
    }, [raw])
}

export default useCalculatedCharacter;
