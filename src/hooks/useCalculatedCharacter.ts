import {
    Character,
    DamageResistanceMap,
    GenericBodyPart,
    RawCharacter,


} from '@/types';
import {useMemo} from 'react'
import {mapItemLocations} from "@/utils/bodyLocations";
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase';
import {createDefaultCompanion} from '@/utils/companionTypes';
import { getOriginById } from '@/services/character/Origin.ts';
import { SKILLS, SkillType } from '@/services/character/utils.ts';

export const adjustCurrentHp = (prev: RawCharacter, current: RawCharacter) => {
    const result: RawCharacter = { ...current };
    const prevMaxHp = calculateMaxHp(prev);
    const currentMaxHp = calculateMaxHp(current);
    const currentHp = prev.currentHp ?? currentMaxHp;
    const hpDelta = currentMaxHp - prevMaxHp;
    // TODO per ora se maxHp aumenta, currentHp aumenta di pari passo
    //      se maxHp diminuisce currentHp rimane tale (o scende a maxHp se superiore)
    if (hpDelta > 0) {
        result.currentHp = currentHp + hpDelta;
    }
    result.currentHp = Math.min(currentHp, currentMaxHp);
    return result;
};

const calculateMaxHp = (character: RawCharacter): number => {
    // TODO duplication of maxHp MEMO...
    return character.special.endurance + character.special.luck + character.level - 1;
};

function useCalculatedCharacter(raw: RawCharacter): Character {

    const dataManager = getGameDatabase()
    // TODO init exchange rates
    const exchangeRates = raw.exchangeRates

    const origin = useMemo(
        () => getOriginById(raw.origin),
        [raw.origin]
    )
    const specialties: SkillType[] = useMemo(
        () => {
            // Ghoul origin adds Survival as specialty
            let result = raw.specialties
            const isGhoul = origin.id === 'ghoul';
            if (isGhoul && !result.includes('survival')) {
                result = [...result, 'survival'];
            }
            if(raw.traits.includes("traitNomad")){
                result = result.filter(r => r !== 'science')
            }
            return result;
        }, [raw.specialties, raw.traits, origin.id]
    )
    const traits = useMemo(
        () => {
            // Get fixed traits from database where FIXED === true AND ORIGINS includes current origin
            const fixedTraits = Object.values(dataManager.traits)
                .filter(trait => trait.FIXED && trait.ORIGINS.includes(origin.id))
                .map(trait => trait.ID);

            // Filter user-selected traits to only include those valid for this origin
            const userTraits = (raw.traits).filter(trait => {
                const traitData = dataManager.traits[trait];
                return traitData?.ORIGINS.includes(origin.id);
            });

            // Combine and deduplicate
            return [...new Set([...fixedTraits, ...userTraits])];
        },
        [raw.traits, origin.id, dataManager.traits]
    )

    const skills = useMemo(
        () => SKILLS.reduce((skills, skillId) => {

            const baseValue = raw.skills[skillId];
            const hasSpecialty = specialties.includes(skillId);
            const skillValue = baseValue + (hasSpecialty ? 2 : 0);
            skills[skillId] = Math.min(skillValue, origin.skillMaxValue);
            return skills
        }, {} as Record<SkillType, number>),
        [origin.skillMaxValue, raw.skills, specialties]
    )

    const maxHp = useMemo(
        () => calculateMaxHp(raw),
        [raw]
    )
    const rads = Math.min(raw.rads, maxHp)
    const effectiveMaxHp = maxHp - rads
    const currentHp = Math.min(raw.currentHp ?? effectiveMaxHp, effectiveMaxHp)

    const maxWeight = useMemo(
        () => {
            let result = origin?.calcMaxCarryWeight(raw.special.strength)
            if(traits.includes('traitSmallFrame')) {
                result = 75 + (raw.special.strength * 2.5)
            }
            // Add carry weight bonuses from equipped items with mods
            raw.items.forEach(item => {
                if (!item.equipped) {return;}
                // TODO Carry weight bonus not currently fully implemented
                const itemData = getModifiedItemData(item);
                if (itemData?.CARRY_WEIGHT_BONUS) {
                    result += Number(itemData.CARRY_WEIGHT_BONUS) || 0;
                }
            });
            return result
        },
        [origin, raw.special.strength, raw.items, traits]
    )

    const currentWeight = useMemo(() => {
        let total = 0
        total += raw.items.reduce((total, item) => {
            const itemData = getModifiedItemData(item);
            const weight = Number(itemData?.WEIGHT) || 0;
            return total + weight * item.quantity;
        }, 0);
        total += raw.customItems.reduce((total, item) => {
            return total + item.WEIGHT * item.quantity;
        }, 0)
        return total
    }, [raw.items, raw.customItems]);

    const maxLuck = useMemo(() => {
        let result = raw.special.luck
        if (traits.includes('traitGifted')) {
            result -= 1
        }
        return result
    }, [raw.special.luck, traits])
    const currentLuck = Math.min(raw.currentLuck ?? maxLuck, maxLuck)

    const defense = useMemo(() => {
        return raw.special.agility < 9 ? 1 : 2
    }, [raw.special.agility])

    const initiative = useMemo(() => {
        return raw.special.agility + raw.special.perception
    }, [raw.special.agility, raw.special.perception])

    const meleeDamage = useMemo(() => {
        if (raw.special.strength < 7) {return 0;}
        if (raw.special.strength < 9) {return 1;}
        if (raw.special.strength < 11) {return 2;}
        return 3;
    }, [raw.special.strength])

    const locationsDR = useMemo(() => {
        const locationsDR = Object.fromEntries(
            Array.from(origin.bodyParts, location => [
                location,
                { physical: 0, energy: 0, radiation: 0 }
            ])
        ) as Record<GenericBodyPart, DamageResistanceMap>;

        // Calculate DR from equipped items only (with mods applied)
        // Use MAX value between under and over layers for each damage type
        raw.items.forEach(item => {
            // Only count equipped items
            if (!item.equipped) {
                return;
            }

            const itemData = getModifiedItemData(item);
            // Skip robot parts if origin is not Mr. Handy
            // TODO might not need the below check
            if (!itemData || (itemData?.CATEGORY === 'robotPart' && !origin.isRobot)) {return;}
            if (!dataManager.isType(itemData, "apparel")) {return;}

            // Get locations this item covers
            const locations = mapItemLocations(itemData.LOCATIONS_COVERED, item.variation);

            // Use MAX between current DR and item DR for each damage type
            locations.forEach(location => {
                if (locationsDR[location]) {
                    locationsDR[location].physical = Math.max(locationsDR[location].physical, itemData.PHYSICAL_RES);
                    locationsDR[location].energy = Math.max(locationsDR[location].energy, itemData.ENERGY_RES);
                    locationsDR[location].radiation = Math.max(locationsDR[location].radiation, itemData.RADIATION_RES);
                }
            });
        });

        // Mr Handy and Ghoul have infinite radiation resistance
        if (origin.hasRadiationImmunity) {
            origin.bodyParts.forEach(location => {
                locationsDR[location].radiation = Infinity;
            });
        }

        return locationsDR;
    }, [raw.items, origin.bodyParts, origin.hasRadiationImmunity, origin.isRobot])


    // Default companion (Eyebot)
    const companion = useMemo(() => {
        if (raw.companion) {
            return raw.companion
        }
        // Return default eyebot companion
        return createDefaultCompanion('eyebot')
    }, [raw.companion])

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
        perks: raw.perks,
        mapCodes: raw.mapCodes,
        companion,

        // Calculated values
        origin,
        maxHp,
        maxLuck,
        maxWeight,
        currentWeight,
        special: raw.special,
        skills,
        defense,
        initiative,
        meleeDamage,
        locationsDR
    }
}

export default useCalculatedCharacter
