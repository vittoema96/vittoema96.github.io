import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import InventoryRow from './InventoryRow.tsx'
import WeaponCard from '../cards/weapon/WeaponCard.tsx'
import ApparelCard from '../cards/apparel/ApparelCard.tsx'
import AidCard from '../cards/aid/AidCard.tsx'
import OtherCard from '../cards/ammo/OtherCard.tsx'
import { CharacterItem, CustomItem } from '@/types';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { ItemCategory, ItemType } from '@/types/item.ts';

type SortBy = 'name' | 'number' | 'rarity'

/**
 * Inventory list with selection-based card display
 * Shows compact rows that can be selected to display details in a dedicated area at the bottom
 */
function InventoryList({
    items = [],
    typeFilter
}: Readonly<{
    items?: CharacterItem[];
    typeFilter: ItemType;
}>) {
    const { t } = useTranslation()
    const { showAddItemPopup } = usePopup()

    const [sortBy, setSortBy] = useState<SortBy>('name')
    const [isAscendingDirection, setIsAscendingDirection] = useState(true)

    const [categoryFilter, setCategoryFilter] = useState<ItemCategory | undefined>(undefined)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)

    const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined)

    useEffect(() => {
        setCategoryFilter(undefined)
        setShowFilterDropdown(false)
    }, [typeFilter]);

    useEffect(() => {
        setShowFilterDropdown(false)
    }, [categoryFilter]);

    const dataManager = getGameDatabase()
    const { character } = useCharacter()

    // TODO should we add ORIGIN apparel here too? but both weapons and apparel might be modified, so should be saved on storage...
    const newItems = useMemo(() => {
        // TODO do we need to filter out non-origin traits here?
        const activeTraits = character.traits
            .map(trait => dataManager.traits[trait]!)
            .filter(trait => trait.ORIGINS.includes(character.origin.id));

        return activeTraits.flatMap(trait => {
            return trait.EFFECTS.flatMap((effect) => {
                const [effectType, item] = effect.split(':')
                if(effectType === 'weaponAdd'){
                    return {
                        id: item,
                        quantity: 1,
                        equipped: false,
                        mods: []
                    } as CharacterItem
                }
                return []
            })
        })
    }, [character.origin.id, character.traits])

    const allItems = useMemo(
        () => [...items, ...newItems],
        [items, newItems]
    );

    // Get subcategories based on main category (sorted alphabetically by translation)
    const getCategories = () => {
        const typeMap = dataManager.getItemTypeMap()
        const categories = [...typeMap[typeFilter]]

        // Add 'custom' category if there are custom items of this type
        // TODO we add custom like this? should we make it a valid category?
        if (typeFilter === 'other' && character.customItems && character.customItems.length > 0) {
            const hasCustomItems = character.customItems.some(item => item.TYPE === typeFilter)
            if (hasCustomItems && !categories.includes('custom')) {
                categories.push('custom')
            }
        }

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
        if(dataManager.isType(itemData, 'ammo') || dataManager.isType(itemData, 'other')) {
            return OtherCard
        }
        return null
    }

    // Filter and sort items
    const processedItems = useMemo(() => {
        // Apply type filter
        const filtered = allItems.filter(item => {
            const itemData = dataManager.getItem(item.id);
            if (!itemData || !dataManager.isType(itemData, typeFilter)) {
                return false;
            }
            return !(categoryFilter && itemData.CATEGORY !== categoryFilter);
        })

        // Apply sorting
        filtered.sort((a, b) => {
            const aData = getModifiedItemData(a) ?? dataManager.getItem(a.id)
            const bData = getModifiedItemData(b) ?? dataManager.getItem(b.id)

            if (!aData || !bData) {return 0}

            let comparison

            switch (sortBy) {
                case 'name':
                    comparison = t(aData.ID).localeCompare(t(bData.ID))
                    break
                case 'number':

                    // Weapons - sort by damage rating
                    if (dataManager.isType(aData, "weapon") && dataManager.isType(bData, "weapon")) {
                        const aDamage = aData.DAMAGE_RATING
                        const bDamage = bData.DAMAGE_RATING
                        comparison = bDamage - aDamage
                    } else if (dataManager.isType(aData, "apparel") && dataManager.isType(bData, "apparel")) {
                        const aPhysical = aData.PHYSICAL_RES
                        const aEnergy = aData.ENERGY_RES
                        const aRadiation = aData.RADIATION_RES
                        const bPhysical = bData.PHYSICAL_RES
                        const bEnergy = bData.ENERGY_RES
                        const bRadiation = bData.RADIATION_RES

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

                        const aHP = {HP: 0, ...aData}.HP
                        const bHP = {HP: 0, ...bData}.HP
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
    }, [allItems, typeFilter, categoryFilter, sortBy, isAscendingDirection, t])

    // Close filter dropdown when clicking outside
    useEffect(() => {
        if (!showFilterDropdown) { return }

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target
            if (target instanceof Element && !target.closest('.inventory-list__filter-wrapper')) {
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
        // Clear selection when sorting
        setSelectedItemId(undefined)
    }

    const getUniqueKey = (i: CharacterItem | CustomItem) => {
        const item = {
            id: 'customItem',
            variation: undefined,
            mods: [],
            ...i
        }
        return [
            item.id,
            item.variation,
            item.customName,
            item.mods.sort()
        ].filter(v => v!== undefined).join("_")
    }

    const renderItems = (itemsList: CharacterItem[]) => {
        return itemsList.map(characterItem => {
            const uniqueKey = getUniqueKey(characterItem)

            return (
                <InventoryRow
                    key={uniqueKey}
                    characterItem={characterItem}
                    isSelected={selectedItemId === uniqueKey}
                    onSelect={() => setSelectedItemId(selectedItemId === uniqueKey ? undefined : uniqueKey)}
                />
            );
        });
    }

    // Render custom items (only for 'other' type)
    const renderCustomItems = () => {
        if (typeFilter !== 'other') {return null;}
        if (character.customItems.length === 0) {return null;}

        // Filter by type first (custom items should match the typeFilter)
        const typeFilteredItems = character.customItems.filter(item => item.TYPE === typeFilter);

        // Filter by category if needed (custom items have category 'custom')
        const filteredCustomItems = categoryFilter
            ? typeFilteredItems.filter(item => item.CATEGORY === categoryFilter)
            : typeFilteredItems;

        return filteredCustomItems.map((customItem) => {
            const uniqueKey = getUniqueKey(customItem);

            return (
                <InventoryRow
                    key={uniqueKey}
                    characterItem={customItem}
                    isSelected={selectedItemId === uniqueKey}
                    onSelect={() => setSelectedItemId(selectedItemId === uniqueKey ? undefined : uniqueKey)}
                />
            );
        });
    }

    return (
        <div className="inventory-list">
            {/* Sort and Filter Controls */}
            <div className="inventory-list__controls row">
                <button
                    className={`inventory-list__sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => handleSortChange('name')}
                    title={t('sortByName')}
                >
                    <i
                        className={`fas fa-sort-alpha-${sortBy === 'name' && isAscendingDirection ? 'down' : 'up'}`}
                    ></i>
                </button>
                <button
                    className={`inventory-list__sort-btn ${sortBy === 'number' ? 'active' : ''}`}
                    onClick={() => handleSortChange('number')}
                    title={t('sortByNumber')}
                >
                    <i
                        className={`fas fa-sort-numeric-${sortBy === 'number' && isAscendingDirection ? 'down' : 'up'}`}
                    ></i>
                </button>
                <button
                    className={`inventory-list__sort-btn ${sortBy === 'rarity' ? 'active' : ''}`}
                    onClick={() => handleSortChange('rarity')}
                    title={t('sortByRarity')}
                >
                    <i className="fas fa-star"></i>
                    <i
                        className={`fas fa-arrow-${sortBy === 'rarity' && isAscendingDirection ? 'down' : 'up'}`}
                        style={{ fontSize: '0.7em', marginLeft: '2px' }}
                    ></i>
                </button>

                {/* Type Filter Button */}
                <div className="inventory-list__filter-wrapper">
                    <button
                        className={`inventory-list__sort-btn ${categoryFilter ? 'active' : ''}`}
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        title={t('filterByType')}
                    >
                        <i className="fas fa-filter"></i>
                    </button>

                    {/* Dropdown menu */}
                    {showFilterDropdown && (
                        <div className="inventory-list__filter-dropdown">
                            <button
                                className={categoryFilter ? '' : 'active'}
                                onClick={() => setCategoryFilter(undefined)}
                            >
                                {t('all')}
                            </button>
                            {getCategories().map(category => (
                                <button
                                    key={category}
                                    className={categoryFilter === category ? 'active' : ''}
                                    onClick={() => setCategoryFilter(category)}
                                >
                                    {t(category)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    className="inventory-list__add-btn"
                    onClick={() => showAddItemPopup({ itemType: typeFilter })}
                    title={t('addItem')}
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>

            {/* Items List */}
            <div className="stack">
                {processedItems.length === 0 &&
                (typeFilter !== 'other' ||
                    !character.customItems ||
                    character.customItems.length === 0) ? (
                    <div className="inventory-list__empty">{t('noItems')}</div>
                ) : (
                    <>
                        {renderItems(processedItems)}
                        {renderCustomItems()}
                    </>
                )}
            </div>

            {/* Selected Item Card Area - Outside inventory-list */}
            {selectedItemId &&
                (() => {

                    // Handle normal database items
                    const selectedItem = [...processedItems, ...character.customItems].find(
                        item => getUniqueKey(item) === selectedItemId,
                    );
                    if (!selectedItem) {
                        return null;
                    } else if ("CATEGORY" in selectedItem) {
                        return (
                            <div className="inventory-list__selected">
                                <OtherCard characterItem={selectedItem} />
                            </div>
                        );
                    }

                    const CardComponent = getCardComponent(selectedItem);
                    if (!CardComponent) {
                        return null;
                    }

                    return (
                        <div className="inventory-list__selected">
                            <CardComponent characterItem={selectedItem} />
                        </div>
                    );
                })()}
        </div>
    );
}

export default InventoryList
