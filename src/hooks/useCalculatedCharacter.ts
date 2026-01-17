import {getOriginById} from '@/utils/characterSheet'
import {
    Character,
    DamageResistanceMap,
    GenericBodyPart,
    RawCharacter,
    SKILLS,
    SkillType
} from "@/types";
import {useMemo} from 'react'
import {mapItemLocations} from "@/utils/bodyLocations";
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase';

export const adjustCurrentHp = (prev: RawCharacter | null, current: RawCharacter) => {
    const result: RawCharacter = { ...current };
    const prevMaxHp = calculateMaxHp(prev);
    const currentMaxHp = calculateMaxHp(current);
    const currentHp = prev?.currentHp ?? currentMaxHp;
    const hpDelta = currentMaxHp - prevMaxHp;
    // TODO per ora se maxHp aumenta, currentHp aumenta di pari passo
    //      se maxHp diminuisce currentHp rimane tale (o scende a maxHp se superiore)
    if (hpDelta > 0) {
        result.currentHp = currentHp + hpDelta;
    }
    result.currentHp = Math.min(currentHp, currentMaxHp);
    return result;
};

export const unequipIrrelevantApparel = (dataManager, current: RawCharacter) => {
    const result: RawCharacter = {...current}
    result.items = current.items?.map(item => {
        const itemData = dataManager.getItem(item.id)
        if (dataManager.isType(itemData, 'apparel') && item.equipped) {
            return {...item, equipped: false}
        }
        return item
    }) || []
    return result
}

const calculateMaxHp = (character: RawCharacter | null): number => {
    // TODO duplication of maxHp MEMO...
    return (character?.special?.endurance ?? 5) +
           (character?.special?.luck ?? 5) +
           (character?.level ?? 1) - 1;
};

function useCalculatedCharacter(raw: RawCharacter | null): Character {


    const name = raw?.name
    const background = raw?.background
    const caps = raw?.caps ?? 0
    const items = raw?.items ?? []
    const level = raw?.level ?? 1
    const specialties = raw?.specialties ?? []

    const dataManager = getGameDatabase()


    const origin = useMemo(
        () => getOriginById(raw?.origin),
        [raw?.origin]
    )

    const DEFAULT_SPECIAL = 5
    const special = {
        strength: useMemo(() => raw?.special?.strength ?? DEFAULT_SPECIAL, [raw?.special?.strength]),
        perception: useMemo(() => raw?.special?.perception ?? DEFAULT_SPECIAL, [raw?.special?.perception]),
        endurance: useMemo(() => raw?.special?.endurance ?? DEFAULT_SPECIAL, [raw?.special?.endurance]),
        charisma: useMemo(() => raw?.special?.charisma ?? DEFAULT_SPECIAL, [raw?.special?.charisma]),
        intelligence: useMemo(() => raw?.special?.intelligence ?? DEFAULT_SPECIAL, [raw?.special?.intelligence]),
        agility: useMemo(() => raw?.special?.agility ?? DEFAULT_SPECIAL, [raw?.special?.agility]),
        luck: useMemo(() => raw?.special?.luck ?? DEFAULT_SPECIAL, [raw?.special?.luck]),
    }
    const currentLuck = raw?.currentLuck ?? special.luck

    const skills = useMemo(
        () => SKILLS.reduce((skills, skillId) => {

            const baseValue = raw?.skills?.[skillId] ?? 0;
            const hasSpecialty = specialties.includes(skillId);
            const skillValue = baseValue + (hasSpecialty ? 2 : 0);
            skills[skillId] = Math.min(skillValue, origin.skillMaxValue);
            return skills
        }, {} as Record<SkillType, number>),
        [raw?.skills, raw?.specialties]
    )

    const maxHp = useMemo(
        () => calculateMaxHp({level, special: {luck: special.luck, endurance: special.endurance }}),
        [special.luck, special.endurance, raw?.level]
    )
    const currentHp = Math.min(raw?.currentHp ?? maxHp, maxHp)

    const maxWeight = useMemo(
        () => {
            let result = origin?.calcMaxCarryWeight(special.strength)
            // Add carry weight bonuses from equipped items with mods
            items.forEach(item => {
                if (!item.equipped) {return;}
                // TODO Carry weight bonus not currently fully implemented
                const itemData = getModifiedItemData(item);
                if (itemData?.CARRY_WEIGHT_BONUS) {
                    result += Number(itemData.CARRY_WEIGHT_BONUS) || 0;
                }
            });
            return result
        },
        [origin, special.strength, raw?.items]
    )

    const currentWeight = useMemo(() => {
    return items.reduce((total, item) => {
        const itemData = getModifiedItemData(item);
        const weight = Number(itemData?.WEIGHT) || 0;
        return total + weight * item.quantity;
    }, 0);
    }, [raw?.items]);

    const maxLuck = useMemo(() => {
        return special.luck // TODO here the Trait like "gifted" could edit max luck
    }, [special.luck])

    const defense = useMemo(() => {
        return special.agility < 9 ? 1 : 2
    }, [special.agility])

    const initiative = useMemo(() => {
        return special.agility + special.perception
    }, [special.agility, special.perception])

    const meleeDamage = useMemo(() => {
        if (special.strength < 7) {return 0;}
        if (special.strength < 9) {return 1;}
        if (special.strength < 11) {return 2;}
        return 3;
    }, [special.strength])

    const locationsDR = useMemo(() => {
        const locationsDR = Object.fromEntries(
            Array.from(origin.bodyParts, location => [
                location,
                { physical: 0, energy: 0, radiation: 0 }
            ])
        ) as Record<GenericBodyPart, DamageResistanceMap>;

        // Calculate DR from equipped items only (with mods applied)
        // Use MAX value between under and over layers for each damage type
        items.forEach(item => {
            // Only count equipped items
            if (!item.equipped) {
                return;
            }

            const itemData = getModifiedItemData(item);
            // Skip robot parts if origin is not Mr. Handy
            if (!itemData || (itemData?.CATEGORY === 'robotPart' && !origin.isRobot)) {return;}
            if (!dataManager.isType(itemData, "apparel")) {return;}

            // Get locations this item covers
            const locations = mapItemLocations(itemData.LOCATIONS_COVERED, item.variation);

            // Use MAX between current DR and item DR for each damage type
            locations.forEach(location => {
                if (locationsDR[location]) {
                    const itemPhysical = Number(itemData.PHYSICAL_RES) || 0;
                    const itemEnergy = Number(itemData.ENERGY_RES) || 0;
                    const itemRadiation = Number(itemData.RADIATION_RES) || 0;

                    locationsDR[location].physical = Math.max(locationsDR[location].physical, itemPhysical);
                    locationsDR[location].energy = Math.max(locationsDR[location].energy, itemEnergy);
                    locationsDR[location].radiation = Math.max(locationsDR[location].radiation, itemRadiation);
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
    }, [origin, raw?.items])

    return {
        // Passthrough (with defaults) values
        name,
        background,
        currentHp,
        currentLuck,
        caps: caps,
        items,
        level: level,
        specialties: specialties,

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
        locationsDR
    }
}

export default useCalculatedCharacter
