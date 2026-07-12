import { useMemo } from 'react';
import { DamageResistanceMap, GenericBodyPart, RawCharacter } from '@/types';
import { getModifiedItemData } from '@/features/item/utils.ts';
import { getGameDatabase, isType } from '@/hooks/getGameDatabase.ts';
import { mapItemLocations } from '@/utils/bodyLocations.ts';
import { Origin } from '@/features/character/origin.ts';

export function useDamageResistances(raw: RawCharacter, origin: Origin){
    return useMemo(() => {
        const dataManager = getGameDatabase();

        // Init bodyParts with values = 0
        const locationsDR = Object.fromEntries(
            Array.from(origin.bodyParts, location => [
                location,
                { physical: 0, energy: 0, radiation: 0 },
            ]),
        ) as Record<GenericBodyPart, DamageResistanceMap>;

        // Calculate DR from equipped items only (with mods applied)
        // Use MAX value between under and over layers for each damage type
        raw.items.forEach(item => {
            // Only count equipped items
            if (!item.equipped) {
                return;
            }

            const itemData = getModifiedItemData(item, raw.perks);
            // Skip robot parts if origin is not Mr. Handy
            // TODO might not need the below check
            if (!itemData || (itemData?.CATEGORY === 'robotPart' && !origin.isRobot)) {
                return;
            }
            if (!isType(itemData, 'apparel')) {
                return;
            }

            // Get locations this item covers
            const locations = mapItemLocations(itemData.LOCATIONS_COVERED, item.variation);

            // Use MAX between current DR and item DR for each damage type
            locations.forEach(location => {
                if (locationsDR[location]) {
                    locationsDR[location].physical = Math.max(
                        locationsDR[location].physical,
                        itemData.PHYSICAL_RES,
                    );
                    locationsDR[location].energy = Math.max(
                        locationsDR[location].energy,
                        itemData.ENERGY_RES,
                    );
                    locationsDR[location].radiation = Math.max(
                        locationsDR[location].radiation,
                        itemData.RADIATION_RES,
                    );
                }
            });
        });

        if (raw.perks.includes('perkBarbarian')) {
            const isWearingPowerArmor = raw.items.some(item => {
                if (!item.equipped) {
                    return false;
                }
                const data = dataManager.getItem(item.id);
                return isType(data, 'apparel') && data.CATEGORY === 'powerArmor'; // TODO fix it when powerArmor is implemented
            });
            if (!isWearingPowerArmor) {
                const barbarianBonus =
                    raw.special.strength >= 11
                        ? 3
                        : raw.special.strength >= 9
                          ? 2
                          : raw.special.strength >= 7
                            ? 1
                            : 0;
                Object.values(locationsDR).forEach(dr => {
                    dr.physical += barbarianBonus;
                });
            }
        }

        // Mr Handy and Ghoul have infinite radiation resistance
        if (origin.hasRadiationImmunity) {
            origin.bodyParts.forEach(location => {
                locationsDR[location].radiation = Infinity;
            });
        }

        return locationsDR;
    }, [
        origin.bodyParts,
        origin.hasRadiationImmunity,
        origin.isRobot,
        raw.items,
        raw.perks,
        raw.special.strength,
    ]);
}
