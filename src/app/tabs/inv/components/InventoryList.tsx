import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import InventoryRow from './InventoryRow.tsx'
import AmmoRow from './AmmoRow.tsx'
import WeaponCard from '../cards/weapon/WeaponCard.tsx'
import ApparelCard from '../cards/apparel/ApparelCard.tsx'
import AidCard from '../cards/aid/AidCard.tsx'
import AmmoCard from '../cards/ammo/AmmoCard.tsx'
import { getItemKey } from '@/utils/itemUtils.ts'
import {CharacterItem, ItemCategory, ItemType} from "@/types";
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { useCharacter } from '@/contexts/CharacterContext.tsx';

interface InventoryListProps {
    items?: CharacterItem[];
    showSearch?: boolean;
    groupByType?: boolean;
    typeFilter: ItemType;
}
type SortBy = 'name' | 'number' | 'rarity'

/**
 * Accordion-style inventory list
 * Shows compact rows that expand to reveal full card details
 */
function InventoryList({
    items = [],
    showSearch = true,
    groupByType = false,
    typeFilter
}: Readonly<InventoryListProps>) {
    const { t } = useTranslation()
    const { showAddItemPopup } = usePopup()
    const [expandedItemId, setExpandedItemId] = useState<string | undefined>(undefined)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<ItemCategory | undefined>(undefined)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [sortBy, setSortBy] = useState<SortBy>('name')
    const [isAscendingDirection, setIsAscendingDirection] = useState(true)

    const dataManager = getGameDatabase()
    const { character } = useCharacter()
    const traits = character.traits
        .map(trait => dataManager.traits[trait])
        .filter(trait => {
        return trait.ORIGINS.includes(character.origin.id)
    })
    const newItems = traits.flatMap(trait => {
        return trait.EFFECTS?.flatMap((effect: string) => {
            const [effectType, item] = effect.split(':')
            if(effectType === 'weaponAdd'){
                return {
                    id: item,
                    quantity: 1,
                    equipped: false,
                    mods: []
                }
            }
            return []
        })
    })
    items = [...items, ...newItems]

    // Get subcategories based on main category (sorted alphabetically by translation)
    const getCategories = () => {
        const typeMap = dataManager.getItemTypeMap()
        const categories = [...typeMap[typeFilter]]

        // TODO add robot categories when necessary
        // Sort alphabetically by translated name
        return categories.sort((a, b) => {
            return t(a).localeCompare(t(b))
        })
    }

    // Get appropriate card component for item type
    const getCardComponent = (characterItem: CharacterItem) => {
        const itemData = dataManager.getItem(characterItem.id)

        if(dataManager.isType(itemData, 'weapon')) {
            return WeaponCard
        }
        if(dataManager.isType(itemData, 'apparel')) {
            return ApparelCard
        }
        if(dataManager.isType(itemData, 'aid')) {
            return AidCard
        }
        if(dataManager.isType(itemData, 'other')) {
            return AmmoCard
        }
        return null
    }

    // Filter and sort items
    const processedItems = useMemo(() => {
        let filtered = [...items]

        // Apply type filter
        filtered = filtered.filter(item => {
            return dataManager.isType(dataManager.getItem(item.id), typeFilter)
        })


        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(item => {
                const itemName = t(item.id).toLowerCase()
                return itemName.includes(query)
            })
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aData = getModifiedItemData(a)
            const bData = getModifiedItemData(b)

            if (!aData || !bData) {return 0}

            let comparison

            switch (sortBy) {
                case 'name':
                    comparison = t(aData.ID).localeCompare(t(bData.ID))
                    break
                case 'number':

                    // Weapons - sort by damage rating
                    if (dataManager.isType(aData, "weapon") && dataManager.isType(bData, "weapon")) {
                        const aDamage = aData.DAMAGE_RATING || 0
                        const bDamage = bData.DAMAGE_RATING || 0
                        comparison = bDamage - aDamage
                    } else if (dataManager.isType(aData, "apparel") && dataManager.isType(bData, "apparel")) {
                        const aPhysical = aData.PHYSICAL_RES || 0
                        const aEnergy = aData.ENERGY_RES || 0
                        const aRadiation = aData.RADIATION_RES || 0
                        const bPhysical = bData.PHYSICAL_RES || 0
                        const bEnergy = bData.ENERGY_RES || 0
                        const bRadiation = bData.RADIATION_RES || 0

                        const aMaxDR = Math.max(aPhysical, aEnergy, aRadiation)
                        const bMaxDR = Math.max(bPhysical, bEnergy, bRadiation)

                        // First compare by max value
                        comparison = bMaxDR - aMaxDR

                        // If max values are equal, compare by sum
                        if (comparison === 0) {
                            const aSumDR = aPhysical + aEnergy + aRadiation
                            const bSumDR = bPhysical + bEnergy + bRadiation
                            comparison = bSumDR - aSumDR
                        }
                    }
                    // Aid - sort by HP restoration
                    else if (dataManager.isType(aData, "aid") && dataManager.isType(bData, "aid")) {
                        const aHP = aData.HP || 0
                        const bHP = bData.HP || 0
                        comparison = bHP - aHP
                    }
                    // Ammo or mixed types - sort by quantity
                    else {
                        comparison = b.quantity - a.quantity
                    }
                    break
                case 'rarity':
                    comparison = (Number(bData.RARITY) || 0) - (Number(aData.RARITY) || 0)
                    break
                default:
                    comparison = 0
            }
            if(comparison === 0){
                comparison = t(aData.ID).localeCompare(t(bData.ID))
            }

            // Apply sort direction
            return isAscendingDirection ? comparison : -comparison
        })

        return filtered
    }, [items, searchQuery, typeFilter, t, sortBy, isAscendingDirection])

    // Group items by type if enabled
    const groupedItems: Partial<Record<ItemCategory, CharacterItem[]>> = useMemo(() => {

        return processedItems.reduce((acc, item) => {
            const itemData = dataManager.getItem(item.id)
            const category = itemData?.CATEGORY || 'ammo'
            return {
                ...acc,
                [category]: [...(acc[category] || []), item]
            }
        }, {} as Record<ItemCategory, CharacterItem[]>)
    }, [processedItems])

    const handleToggle = (itemId: string) => {
        setExpandedItemId(expandedItemId === itemId ? undefined : itemId)
    }

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        // Close expanded item when searching
        setExpandedItemId(undefined)
    }

    const handleCategoryFilterChange = (newCategory: ItemCategory | undefined) => {
        setCategoryFilter(newCategory)
        setShowFilterDropdown(false)
        setExpandedItemId(undefined)
    }

    const toggleFilterDropdown = () => {
        setShowFilterDropdown(!showFilterDropdown)
    }

    // Close filter dropdown when clicking outside
    useEffect(() => {
        if (!showFilterDropdown) {return}

        const handleClickOutside = (e) => {
            if (!e.target.closest('.inventory-list__filter-wrapper')) {
                setShowFilterDropdown(false)
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [showFilterDropdown])

    const handleSortChange = (newSort: SortBy) => {
        // If clicking the same sort button, toggle direction
        if (sortBy === newSort) {
            setIsAscendingDirection(!isAscendingDirection)
        } else {
            // New sort type, reset to ascending
            setSortBy(newSort)
            setIsAscendingDirection(true)
        }
        // Close expanded item when sorting
        setExpandedItemId(undefined)
    }

    const renderItems = (itemsList: CharacterItem[]) => {
        return itemsList.map(characterItem => {
            const itemData = dataManager.getItem(characterItem.id)
            if(!itemData
                || !dataManager.isType(itemData, typeFilter)
                    || (categoryFilter && itemData.CATEGORY !== categoryFilter)){
                return null
            }
            const uniqueKey = getItemKey(characterItem)

            // Ammo items use simple row (no accordion)
            if (itemData.CATEGORY === 'ammo') {
                return (
                    <AmmoRow
                        key={uniqueKey}
                        characterItem={characterItem}
                    />
                )
            }

            // All other items use accordion row
            return (
                <InventoryRow
                    key={uniqueKey}
                    characterItem={characterItem}
                    isExpanded={expandedItemId === uniqueKey}
                    onToggle={() => handleToggle(uniqueKey)}
                    cardComponent={getCardComponent(characterItem)}
                />
            )
        })
    }

    const renderGroupedItems = (groupedItems: Record<string, CharacterItem[]>) => {
        return Object.entries(groupedItems).map(([category, typeItems]) => (
            <div key={category} className="inventory-list__group">
                <div className="inventory-list__group-header">
                    <span>{t(category)}</span>
                    <span className="inventory-list__group-count">
                                    ({typeItems.length})
                                </span>
                </div>
                {renderItems(typeItems)}
            </div>
        ))
    }

    return (
        <div className="inventory-list">
            {/* Search and Sort Controls */}
            {showSearch && (
                <div className="inventory-list__controls">
                    <div className="inventory-list__search">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder={t('searchItems')}
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="inventory-list__search-input"
                        />
                        {searchQuery && (
                            <button
                                className="inventory-list__search-clear"
                                onClick={() => setSearchQuery('')}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>

                    <div className="inventory-list__actions">
                        <div className="inventory-list__sort">
                            <button
                                className={`inventory-list__sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                                onClick={() => handleSortChange('name')}
                                title={t('sortByName')}
                            >
                                <i className={`fas fa-sort-alpha-${sortBy === 'name' && isAscendingDirection ? 'down' : 'up'}`}></i>
                            </button>
                            <button
                                className={`inventory-list__sort-btn ${sortBy === 'number' ? 'active' : ''}`}
                                onClick={() => handleSortChange('number')}
                                title={t('sortByNumber')}
                            >
                                <i className={`fas fa-sort-numeric-${sortBy === 'number' && isAscendingDirection ? 'down' : 'up'}`}></i>
                            </button>
                            <button
                                className={`inventory-list__sort-btn ${sortBy === 'rarity' ? 'active' : ''}`}
                                onClick={() => handleSortChange('rarity')}
                                title={t('sortByRarity')}
                            >
                                <i className="fas fa-star"></i>
                                <i className={`fas fa-arrow-${sortBy === 'rarity' && isAscendingDirection ? 'down' : 'up'}`} style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
                            </button>

                            {/* Type Filter Button - only show if categoryFilter is provided */}
                            <div className="inventory-list__filter-wrapper">
                                <button
                                    className={`inventory-list__sort-btn ${categoryFilter ? 'active' : ''}`}
                                    onClick={toggleFilterDropdown}
                                    title={t('filterByType')}
                                >
                                    <i className="fas fa-filter"></i>
                                </button>

                                {/* Dropdown menu */}
                                {showFilterDropdown && (
                                    <div className="inventory-list__filter-dropdown">
                                        <button
                                            className={categoryFilter ? '' : 'active'}
                                            onClick={() => handleCategoryFilterChange(undefined)}
                                        >
                                            {t('all')}
                                        </button>
                                        {getCategories().map(category => (
                                            <button
                                                key={category}
                                                className={categoryFilter === category ? 'active' : ''}
                                                onClick={() => handleCategoryFilterChange(category)}
                                            >
                                                {t(category)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        <button
                            className="inventory-list__add-btn"
                            onClick={() => showAddItemPopup(typeFilter)}
                            title={t('addItem')}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="inventory-list__items">
                {processedItems.length === 0 ? (
                    <div className="inventory-list__empty">
                        {searchQuery ? t('noItemsFound') : t('noItems')}
                    </div>
                ) : groupByType ? (
                    // Grouped by type
                    renderGroupedItems(groupedItems)
                ) : (
                    // Flat list
                    renderItems(processedItems)
                )}
            </div>
        </div>
    )
}

export default InventoryList
