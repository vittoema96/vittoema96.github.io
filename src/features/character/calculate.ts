import { Character, RawCharacter } from '@/types';
import { getOriginById } from '@/features/character/origins/registry';
import {
    SkillType,
    calculateSkills,
    calculateSkillPoints,
} from '@/features/character/skills/skills.ts';
import { TraitId, calculateTraits } from '@/features/character/feats/traits.ts';
import { PerkId, calculatePerks } from '@/features/character/feats/perks.ts';
import {
    calculateSpecialties,
    calculateSpecialtyPoints,
} from '@/features/character/specialties.ts';
import { calculateCurrentWeight, calculateMaxWeight } from '@/features/character/weight.ts';
import { calculateDamageResistances } from '@/features/character/damageResistances.ts';
import { calculateMaxHp } from '@/features/character/hp.ts';
import { calculateMaxLuck } from '@/features/character/luck.ts';
import { calculateMeleeDamage } from '@/features/character/meleeDamage.ts';
import { getAvailableCompanions } from '@/features/character/feats/rules';
import { createDefaultCompanion } from '@/utils/companionTypes.ts';
import { calculateSpecialPoints } from '@/features/character/special/special.ts';
import { getInventory } from '@/features/character/items.ts';

export function calculateCharacter(raw: RawCharacter): Character {
    // TODO init exchange rates
    const level = raw.level;
    const exchangeRates = raw.exchangeRates;

    const origin = getOriginById(raw.origin);
    const traits: TraitId[] = calculateTraits(raw, origin);
    const perks: PerkId[] = calculatePerks(raw);

    const specialties: SkillType[] = calculateSpecialties(raw, origin, traits);

    const special = raw.special;
    const skills = calculateSkills(raw, specialties, origin, perks, traits);
    const skillPoints = calculateSkillPoints(
        special,
        skills,
        specialties,
        level,
        perks,
        traits,
        origin,
    );
    const specialPoints = calculateSpecialPoints(special, origin, perks, traits);
    const specialtyPoints = calculateSpecialtyPoints(specialties, origin, perks, traits);

    const maxHp = calculateMaxHp(special, level, perks, traits, origin);
    const rads = Math.min(raw.rads, maxHp);
    const effectiveMaxHp = maxHp - rads;
    const currentHp = Math.min(raw.currentHp ?? effectiveMaxHp, effectiveMaxHp);

    const maxLuck = calculateMaxLuck(special, perks, traits, origin);

    const currentLuck = Math.min(raw.currentLuck ?? maxLuck, maxLuck);
    const defense = special.agility < 9 ? 1 : 2;
    const initiative = special.agility + special.perception;

    const meleeDamage = calculateMeleeDamage(special, traits, perks, origin);

    const availableCompanions = getAvailableCompanions(perks, traits, origin);
    const companions = availableCompanions.reduce<typeof raw.companions>((acc, c) => {
        if (raw.companions[c]) {
            acc[c] = raw.companions[c];
        }
        return acc;
    }, {});

    const activeId = raw.activeCompanionId;
    const targetId =
        activeId && availableCompanions.includes(activeId) ? activeId : availableCompanions[0];
    const companion = targetId
        ? (companions[targetId] ?? createDefaultCompanion(targetId))
        : undefined;

    const { items, displayItems } = getInventory(raw.items, { origin, perks, traits });

    const activeCharacter = { ...raw, items };
    const maxWeight = calculateMaxWeight(activeCharacter, origin, perks, traits);
    const currentWeight = calculateCurrentWeight(activeCharacter, perks);
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
        items: displayItems,
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
}
