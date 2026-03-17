import {useMemo} from 'react'
import {useCharacter} from '@/contexts/CharacterContext.tsx'
import {ORIGINS} from "@/utils/characterSheet.ts";
import {getGameDatabase} from "@/hooks/getGameDatabase.ts"
import {CharacterItem, ItemType} from "@/types";

/**
 * Custom hook for filtering and organizing inventory items
 */
export const useInventoryFilter = (itemType: ItemType) => {
    const { character } = useCharacter()
    const dataManager = getGameDatabase()

    return useMemo(() => {
        if (!character.items || !dataManager.getItemTypeMap) {return []}

        let items = character.items.filter(item => {
            // Filter by item type
            const itemData = dataManager.getItem(item.id)
            if (itemData?.TYPE !== itemType) {return false}

            // Hide robot parts if origin is not Mr. Handy
            return itemData?.CATEGORY !== 'robotPart' || character.origin === ORIGINS.MR_HANDY;
        })

        items = addSpecialWeaponItems(items, character.origin.isRobot)

        return items
    }, [character.items, character.origin, itemType])
}

/**
 * Add special weapon items (unarmed strike, gun bash)
 */
const addSpecialWeaponItems = (items: CharacterItem[], isRobot: boolean) => {
    const dataManager = getGameDatabase()
    const resultItems: CharacterItem[] = [...items]

    const addSpecialItem = (itemToCheck: CharacterItem, specialItemId: string, condition: (item: CharacterItem) => boolean) => {
        const isConditionMet = condition(itemToCheck)
        if(isConditionMet) {
            const existingItem = resultItems.find(i => i.id === specialItemId)
            if (existingItem) {
                existingItem.quantity = existingItem.quantity + itemToCheck.quantity
            } else {
                resultItems.push({
                    id: specialItemId,
                    quantity: itemToCheck.quantity,
                    mods: [],
                    equipped: false
                })
            }
        }
    }

    /** Condition used with addSpecialItem to add/update gun bash items.
     * @param twoHandedCondition if true, checks for two-handed weapons, if false, checks for one-handed weapons
     */
    const gunBashCondition = (twoHandedCondition: boolean) => {
        return (item: CharacterItem) => {
            const itemData = dataManager.getItem(item.id)
            if(!itemData) {
                return false
            }
            if(dataManager.isType(itemData, 'weapon')) {
                const hasGunBash = ['bigGuns', 'smallGuns', 'energyWeapons'].includes(itemData.CATEGORY)
                const isTwoHanded = itemData.QUALITIES?.includes('qualityTwoHanded')
                return hasGunBash && (twoHandedCondition === isTwoHanded)
            }
            return false
        }
    }
    /** Condition used with addSpecialItem to add/update items based on a mod */
    const modCondition = (modId: string) => {
        return (item: CharacterItem) => {
            return item.mods.includes(modId)
        }
    }


    // Everyone has unarmed strike
    if(!isRobot){
        resultItems.push({
            id: 'weaponUnarmedStrike',
            quantity: 1,
            mods: [],
            equipped: false,
        });
    }

    // Cycle over character items and add/update specialItems
    resultItems.forEach(item => {
        addSpecialItem(item, 'weaponWeaponStockOneHanded', gunBashCondition(false))
        addSpecialItem(item, 'weaponWeaponStock', gunBashCondition(true))
        addSpecialItem(item, 'weaponBayonet', modCondition('modBayonet'))
        addSpecialItem(item, 'weaponMissileLauncherBayonet', modCondition("modMissileLauncherBayonet"))
        addSpecialItem(item, 'weaponShredder', modCondition('modShredder'))
    })

    return resultItems
}

