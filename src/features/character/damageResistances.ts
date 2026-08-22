import { CharacterItem, DamageResistanceMap, GenericBodyPart } from '@/types';
import { getModifiedItemData, isType } from '@/features/item/utils.ts';
import { mapItemLocations } from '@/utils/bodyLocations.ts';
import { Origin } from '@/features/character/origin.ts';
import { getLocationDRBonus } from '@/features/character/feats';
import { PerkId } from '@/features/character/feats/perks/perks.ts';
import { SpecialMap } from '@/features/character/special/special.ts';
import { TraitId } from '@/features/character/feats/traits/traits.ts';

export function calculateDamageResistances(
    special: SpecialMap,
    items: CharacterItem[],
    origin: Origin,
    perks: PerkId[],
    traits: TraitId[]
){
    // Init bodyParts with values = 0
    const locationsDR = Object.fromEntries(
        Array.from(origin.bodyParts, location => [
            location,
            { physical: 0, energy: 0, radiation: 0 },
        ]),
    ) as Record<GenericBodyPart, DamageResistanceMap>;

    // Calculate DR from equipped items only (with mods applied)
    // Use MAX value between under and over layers for each damage type
    items.forEach(item => {
        // Only count equipped items
        if (!item.equipped) {
            return;
        }

        const itemData = getModifiedItemData(item, perks);
        // Skip robot parts if origin is not Mr. Handy
        // TODO might not need the below check
        if (!itemData || (itemData?.CATEGORY === 'robotPart' && !origin.isRobot)) {
            return;
        }
        if (!isType(itemData, 'apparel')) {
            return;
        }

        // Get locations this item covers
        const locations = mapItemLocations(itemData.LOCATIONS_COVERED, item.side);

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

    const drBonus = getLocationDRBonus(
        special, items,
        perks, traits
    )
    Object.values(locationsDR).forEach(dr => {
        dr.physical += drBonus.physical;
        dr.energy += drBonus.energy;
        dr.radiation += drBonus.radiation;
    });

    // Mr Handy and Ghoul have infinite radiation resistance
    if (origin.hasRadiationImmunity) {
        origin.bodyParts.forEach(location => {
            locationsDR[location].radiation = Infinity;
        });
    }

    return locationsDR;
}
