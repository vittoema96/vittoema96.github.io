import {useMemo} from 'react'
import {useCharacter} from '../contexts/CharacterContext.jsx'
import {useDataManager} from './useDataManager.js'

/**
 * Custom hook for filtering and organizing inventory items
 * @param {string} category - Category to filter by (weapon, apparel, aid, other)
 * @returns {Array} Filtered items for the category
 */
export const useInventoryFilter = (category) => {
    const { character } = useCharacter()
    const dataManager = useDataManager()

    return useMemo(() => {
        if (!character.items || !dataManager.getItemTypeMap) return []

        const typeMap = dataManager.getItemTypeMap()
        const typesInCategory = typeMap[category] || []

        let items = character.items.filter(item => {
            // Filter by category type
            if (!typesInCategory.includes(item.type)) return false

            // Hide robot parts if origin is not Mr. Handy
            return !(item.type === 'robotParts' && character.origin !== 'mrHandy');
        })

        // Add special items for weapon category
        if (category === 'weapon') {
            items = addSpecialWeaponItems(items, character, dataManager)
        }

        return items
    }, [character.items, character.origin, category, dataManager])
}

/**
 * Add special weapon items (unarmed strike, gun bash)
 * @param {Array} items - Current weapon items
 * @param {Object} character - Character object
 * @param {Object} dataManager - Data manager instance
 * @returns {Array} Items with special weapons added
 */
const addSpecialWeaponItems = (items, character, dataManager) => {
    const specialItems = [...items]

    // Add unarmed strike
    specialItems.push({
        id: 'weaponUnarmedStrike',
        type: 'unarmed',
        quantity: 1,
    })

    // Add gun bash items (weapon stock) for ranged weapons
    // Aggregate quantities by type (1-handed vs 2-handed)
    let oneHandedGunBashQty = 0
    let twoHandedGunBashQty = 0

    character.items.forEach(item => {
        const itemData = dataManager.getItem(item.id)
        if (itemData && dataManager.isType(item.type, 'weapon')) {
            // Check if it's a ranged weapon (not melee, unarmed, throwing, or explosives)
            const isRangedWeapon = !['meleeWeapons', 'unarmed', 'throwing', 'explosives'].includes(item.type)
            
            if (isRangedWeapon) {
                const isTwoHanded = itemData.HANDS === 2
                if (isTwoHanded) {
                    twoHandedGunBashQty += item.quantity || 1
                } else {
                    oneHandedGunBashQty += item.quantity || 1
                }
            }
        }
    })

    // Add gun bash items if there are ranged weapons
    if (oneHandedGunBashQty > 0) {
        specialItems.push({
            id: 'weaponWeaponStockOneHanded',
            type: 'unarmed',
            quantity: oneHandedGunBashQty,
        })
    }

    if (twoHandedGunBashQty > 0) {
        specialItems.push({
            id: 'weaponWeaponStock',
            type: 'unarmed',
            quantity: twoHandedGunBashQty,
        })
    }

    // Add bayonet and shredder items for weapons with those mods
    character.items.forEach(item => {
        if (!item.mods || item.mods.length === 0) return

        const hasBayonet = item.mods.includes('modBayonet')
        const hasMissileLauncherBayonet = item.mods.includes('modMissileLauncherBayonet')
        const hasShredder = item.mods.includes('modShredder')

        if (hasBayonet) {
            // Check if bayonet already exists
            const existingBayonet = specialItems.find(i => i.id === 'weaponBayonet')
            if (existingBayonet) {
                existingBayonet.quantity += item.quantity || 1
            } else {
                specialItems.push({
                    id: 'weaponBayonet',
                    type: 'meleeWeapons',
                    quantity: item.quantity || 1,
                })
            }
        }

        if (hasMissileLauncherBayonet) {
            const existingBayonet = specialItems.find(i => i.id === 'weaponMissileLauncherBayonet')
            if (existingBayonet) {
                existingBayonet.quantity += item.quantity || 1
            } else {
                specialItems.push({
                    id: 'weaponMissileLauncherBayonet',
                    type: 'meleeWeapons',
                    quantity: item.quantity || 1,
                })
            }
        }

        if (hasShredder) {
            const existingShredder = specialItems.find(i => i.id === 'weaponShredder')
            if (existingShredder) {
                existingShredder.quantity += item.quantity || 1
            } else {
                specialItems.push({
                    id: 'weaponShredder',
                    type: 'meleeWeapons',
                    quantity: item.quantity || 1,
                })
            }
        }
    })

    return specialItems
}

