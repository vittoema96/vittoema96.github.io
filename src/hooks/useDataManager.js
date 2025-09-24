import { useState, useEffect } from 'react'
import Papa from 'papaparse'

/**
 * React hook for managing game data (weapons, apparel, aid, etc.)
 * Loads CSV files and provides item lookup functionality
 */
export const useDataManager = () => {
    const [data, setData] = useState({
        weapon: {},
        apparel: {},
        aid: {},
        other: {},
        perks: {},
        allItemData: {},
        isLoading: true,
        error: null
    })

    // Parse CSV file using PapaParse
    const parseCSV = (fileUrl) => {
        return new Promise((resolve, reject) => {
            Papa.parse(fileUrl, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: results => {
                    const dataMap = results.data.reduce((map, row) => {
                        // Parse JSON strings in CSV cells
                        for (const columnName in row) {
                            const value = row[columnName]
                            
                            if (typeof value === 'string') {
                                const trimmedValue = value.trim()
                                if (
                                    (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) ||
                                    (trimmedValue.startsWith('{') && trimmedValue.endsWith('}'))
                                ) {
                                    try {
                                        row[columnName] = JSON.parse(trimmedValue)
                                    } catch (e) {
                                        console.error(
                                            `Error parsing JSON in CSV: ${trimmedValue}. Error: ${e}`
                                        )
                                    }
                                }
                            }
                        }
                        
                        map[row.ID] = row
                        return map
                    }, {})
                    resolve(dataMap)
                },
                error: reject,
            })
        })
    }

    // Load all data on mount
    useEffect(() => {
        const loadAllData = async () => {
            try {
                setData(prev => ({ ...prev, isLoading: true, error: null }))

                // Load weapon data
                const [smallGuns, energyWeapons, bigGuns, meleeWeapons, throwing, explosives] =
                    await Promise.all([
                        parseCSV('data/weapon/smallGuns.csv'),
                        parseCSV('data/weapon/energyWeapons.csv'),
                        parseCSV('data/weapon/bigGuns.csv'),
                        parseCSV('data/weapon/meleeWeapons.csv'),
                        parseCSV('data/weapon/throwing.csv'),
                        parseCSV('data/weapon/explosives.csv'),
                    ])
                
                const weapon = {
                    ...smallGuns,
                    ...energyWeapons,
                    ...bigGuns,
                    ...meleeWeapons,
                    ...throwing,
                    ...explosives,
                }

                // Load apparel data
                const [armor, clothing] = await Promise.all([
                    parseCSV('data/apparel/armor.csv'),
                    parseCSV('data/apparel/clothing.csv'),
                ])
                const apparel = { ...armor, ...clothing }

                // Load aid data
                const [food, drinks, meds] = await Promise.all([
                    parseCSV('data/aid/food.csv'),
                    parseCSV('data/aid/drinks.csv'),
                    parseCSV('data/aid/meds.csv'),
                ])
                const aid = { ...food, ...drinks, ...meds }

                // Load other data
                const [ammo] = await Promise.all([parseCSV('data/other/ammo.csv')])
                const other = { ...ammo }

                // Load perks
                const perks = await parseCSV('data/perks.csv')

                // Combine all item data
                const allItemData = { ...weapon, ...apparel, ...aid, ...other }

                setData({
                    weapon,
                    apparel,
                    aid,
                    other,
                    perks,
                    allItemData,
                    isLoading: false,
                    error: null
                })

                console.log('DataManager: All data loaded successfully')
            } catch (error) {
                console.error('DataManager: Failed to load data:', error)
                setData(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error.message
                }))
            }
        }

        loadAllData()
    }, [])

    // Utility functions
    const getItemTypeMap = () => ({
        weapon: [
            'smallGuns',
            'energyWeapons',
            'bigGuns',
            'meleeWeapons',
            'explosives',
            'throwing',
            'unarmed',
        ],
        apparel: [
            'clothing',
            'outfit',
            'headgear',
            'raiderArmor',
            'leatherArmor',
            'metalArmor',
            'combatArmor',
        ],
        aid: ['food', 'drinks', 'meds'],
        other: ['ammo'],
    })

    const isType = (subtypeToCheck, type) => {
        return getItemTypeMap()[type].includes(subtypeToCheck)
    }

    const getItem = (itemId) => {
        return data.allItemData[itemId] || null
    }

    const getUnacquirableIds = () => {
        return ['weaponUnarmedStrike', 'weaponWeaponStock', 'weaponWeaponStockOneHanded']
    }

    const isUnacquirable = (id) => {
        if (id) {
            if (id.ID) {
                id = id.ID
            }
            return getUnacquirableIds().includes(id)
        }
        return false
    }

    return {
        ...data,
        getItemTypeMap,
        isType,
        getItem,
        getUnacquirableIds,
        isUnacquirable
    }
}
