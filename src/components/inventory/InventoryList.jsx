import React, { useState, useMemo, useEffect } from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { usePopup } from '../../contexts/PopupContext.jsx'
import { SKILLS } from '../../js/constants.js'
import InventoryRow from './InventoryRow.jsx'
import AmmoRow from './AmmoRow.jsx'
import WeaponCard from './WeaponCard.jsx'
import ApparelCard from './ApparelCard.jsx'
import AidCard from './AidCard.jsx'
import AmmoCard from './AmmoCard.jsx'
import { getModifiedItemData, getItemKey } from '../../utils/itemUtils.js'

/**
 * Accordion-style inventory list
 * Shows compact rows that expand to reveal full card details
 */
function InventoryList({
    items = [],
    dataManager,
    autoCollapse = true,
    showSearch = true,
    groupByType = false,
    categoryFilter = null // 'weapon', 'apparel', 'aid', 'other' - determines which subcategories to show
}) {
    const t = useI18n()
    const { showAddItemPopup } = usePopup()
    const [expandedItemId, setExpandedItemId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('all') // 'all' or specific subtype
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [sortBy, setSortBy] = useState('name') // name, number, rarity
    const [sortDirection, setSortDirection] = useState('asc') // asc or desc

    // Get subcategories based on main category (sorted alphabetically by translation)
    const getSubcategories = () => {
        if (!categoryFilter || !dataManager.getItemTypeMap) return []
        const typeMap = dataManager.getItemTypeMap()
        const subcategories = typeMap[categoryFilter] || []

        // Sort alphabetically by translated name
        return subcategories.sort((a, b) => {
            const nameA = formatCategoryName(a)
            const nameB = formatCategoryName(b)
            return nameA.localeCompare(nameB)
        })
    }

    // Get appropriate card component for item type
    const getCardComponent = (characterItem) => {
        const itemType = characterItem.type

        // Weapon
        if (Object.values(SKILLS).includes(itemType)) {
            return WeaponCard
        }

        // Apparel
        if (['clothing', 'headgear', 'outfit', 'robotParts'].includes(itemType) || itemType.endsWith('Armor')) {
            return ApparelCard
        }

        // Ammo
        if (itemType === 'ammo') {
            return AmmoCard
        }

        // Aid (food, drinks, meds)
        return AidCard
    }

    // Filter and sort items
    const processedItems = useMemo(() => {
        let filtered = [...items]

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(item => item.type === typeFilter)
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(item => {
                const [itemId] = item.id.split('_')
                const itemData = getModifiedItemData(dataManager, itemId, item.mods)
                if (!itemData) return false

                const itemName = t(itemData.ID).toLowerCase()
                return itemName.includes(query)
            })
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const [aId] = a.id.split('_')
            const [bId] = b.id.split('_')
            const aData = getModifiedItemData(dataManager, aId, a.mods)
            const bData = getModifiedItemData(dataManager, bId, b.mods)

            if (!aData || !bData) return 0

            let comparison = 0

            switch (sortBy) {
                case 'name':
                    comparison = t(aData.ID).localeCompare(t(bData.ID))
                    break
                case 'number':
                    // Sort by damage for weapons, DR for apparel, HP for aid, quantity for ammo
                    const aType = a.type
                    const bType = b.type

                    // Weapons - sort by damage rating
                    if (Object.values(SKILLS).includes(aType) && Object.values(SKILLS).includes(bType)) {
                        const aDamage = parseInt(aData.DAMAGE_RATING) || 0
                        const bDamage = parseInt(bData.DAMAGE_RATING) || 0
                        comparison = bDamage - aDamage
                    }
                    // Apparel - sort by maximum damage reduction value, then by sum if equal
                    else if ((['clothing', 'headgear', 'outfit', 'robotParts'].includes(aType) || aType.endsWith('Armor')) &&
                             (['clothing', 'headgear', 'outfit', 'robotParts'].includes(bType) || bType.endsWith('Armor'))) {
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
                    else if (['food', 'drinks', 'meds'].includes(aType) && ['food', 'drinks', 'meds'].includes(bType)) {
                        const aHP = aData.HP || 0
                        const bHP = bData.HP || 0
                        comparison = bHP - aHP
                    }
                    // Ammo or mixed types - sort by quantity
                    else {
                        comparison = (b.quantity || 0) - (a.quantity || 0)
                    }
                    break
                case 'rarity':
                    comparison = (bData.RARITY || 0) - (aData.RARITY || 0)
                    break
                default:
                    comparison = 0
            }

            // Apply sort direction
            return sortDirection === 'asc' ? comparison : -comparison
        })

        return filtered
    }, [items, typeFilter, searchQuery, sortBy, sortDirection, dataManager, t])

    // Group items by type if enabled
    const groupedItems = useMemo(() => {
        if (!groupByType) {
            return { all: processedItems }
        }

        const groups = {}
        processedItems.forEach(item => {
            const type = item.type
            if (!groups[type]) {
                groups[type] = []
            }
            groups[type].push(item)
        })

        return groups
    }, [processedItems, groupByType])

    const handleToggle = (itemId) => {
        if (autoCollapse) {
            // Auto-collapse: only one item expanded at a time
            setExpandedItemId(expandedItemId === itemId ? null : itemId)
        } else {
            // Manual mode: toggle individual items
            setExpandedItemId(expandedItemId === itemId ? null : itemId)
        }
    }

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        // Close expanded item when searching
        setExpandedItemId(null)
    }

    const handleTypeFilterChange = (newType) => {
        setTypeFilter(newType)
        setShowFilterDropdown(false)
        // Close expanded item when filtering
        setExpandedItemId(null)
    }

    const toggleFilterDropdown = () => {
        setShowFilterDropdown(!showFilterDropdown)
    }

    // Close filter dropdown when clicking outside
    useEffect(() => {
        if (!showFilterDropdown) return

        const handleClickOutside = (e) => {
            if (!e.target.closest('.inventory-list__filter-wrapper')) {
                setShowFilterDropdown(false)
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [showFilterDropdown])

    const handleSortChange = (newSort) => {
        // If clicking the same sort button, toggle direction
        if (sortBy === newSort) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            // New sort type, reset to ascending
            setSortBy(newSort)
            setSortDirection('asc')
        }
        // Close expanded item when sorting
        setExpandedItemId(null)
    }

    // Helper to format category names in Title Case
    const formatCategoryName = (category) => {
        return t(category)
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    const renderItems = (itemsList) => {
        return itemsList.map(characterItem => {
            const [itemId] = characterItem.id.split('_')
            const itemData = getModifiedItemData(dataManager, itemId, characterItem.mods)
            const uniqueKey = getItemKey(characterItem)

            if (!itemData) return null

            // Ammo items use simple row (no accordion)
            if (characterItem.type === 'ammo') {
                return (
                    <AmmoRow
                        key={uniqueKey}
                        characterItem={characterItem}
                        itemData={itemData}
                    />
                )
            }

            // All other items use accordion row
            return (
                <InventoryRow
                    key={uniqueKey}
                    characterItem={characterItem}
                    itemData={itemData}
                    isExpanded={expandedItemId === uniqueKey}
                    onToggle={() => handleToggle(uniqueKey)}
                    cardComponent={getCardComponent(characterItem)}
                />
            )
        })
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
                                <i className={`fas fa-sort-alpha-${sortBy === 'name' && sortDirection === 'desc' ? 'up' : 'down'}`}></i>
                            </button>
                            <button
                                className={`inventory-list__sort-btn ${sortBy === 'number' ? 'active' : ''}`}
                                onClick={() => handleSortChange('number')}
                                title={t('sortByNumber')}
                            >
                                <i className={`fas fa-sort-numeric-${sortBy === 'number' && sortDirection === 'desc' ? 'up' : 'down'}`}></i>
                            </button>
                            <button
                                className={`inventory-list__sort-btn ${sortBy === 'rarity' ? 'active' : ''}`}
                                onClick={() => handleSortChange('rarity')}
                                title={t('sortByRarity')}
                            >
                                <i className="fas fa-star"></i>
                                <i className={`fas fa-arrow-${sortDirection === 'desc' ? 'up' : 'down'}`} style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
                            </button>

                            {/* Type Filter Button - only show if categoryFilter is provided */}
                            {categoryFilter && (
                                <div className="inventory-list__filter-wrapper">
                                    <button
                                        className={`inventory-list__sort-btn ${typeFilter !== 'all' ? 'active' : ''}`}
                                        onClick={toggleFilterDropdown}
                                        title={t('filterByType')}
                                    >
                                        <i className="fas fa-filter"></i>
                                    </button>

                                    {/* Dropdown menu */}
                                    {showFilterDropdown && (
                                        <div className="inventory-list__filter-dropdown">
                                            <button
                                                className={typeFilter === 'all' ? 'active' : ''}
                                                onClick={() => handleTypeFilterChange('all')}
                                            >
                                                {t('all')}
                                            </button>
                                            {getSubcategories().map(subtype => (
                                                <button
                                                    key={subtype}
                                                    className={typeFilter === subtype ? 'active' : ''}
                                                    onClick={() => handleTypeFilterChange(subtype)}
                                                >
                                                    {formatCategoryName(subtype)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            className="inventory-list__add-btn"
                            onClick={() => showAddItemPopup(categoryFilter)}
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
                    Object.entries(groupedItems).map(([type, typeItems]) => (
                        <div key={type} className="inventory-list__group">
                            <div className="inventory-list__group-header">
                                <span>{t(type)}</span>
                                <span className="inventory-list__group-count">
                                    ({typeItems.length})
                                </span>
                            </div>
                            {renderItems(typeItems)}
                        </div>
                    ))
                ) : (
                    // Flat list
                    renderItems(processedItems)
                )}
            </div>
        </div>
    )
}

export default InventoryList
