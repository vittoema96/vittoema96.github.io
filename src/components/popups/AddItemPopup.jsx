import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { isSameConfiguration } from '../../utils/itemUtils.js'

/**
 * Add Item popup component for adding items to inventory
 * itemType can be a category ('weapon', 'apparel', 'aid', 'other') or null for all items
 */
function AddItemPopup({ isOpen, onClose, itemType = null, dataManager }) {
    const [selectedItemId, setSelectedItemId] = useState('')
    const [selectedItemType, setSelectedItemType] = useState('') // The actual TYPE of the selected item
    const [quantity, setQuantity] = useState(1)
    const [availableItems, setAvailableItems] = useState([])
    const [typeFilter, setTypeFilter] = useState('all') // all, or specific subtype
    const [rarityFilter, setRarityFilter] = useState('all') // all, or max rarity level
    const [shouldBuy, setShouldBuy] = useState(false) // Whether to deduct caps

    const t = useI18n()
    const { character, updateCharacter } = useCharacter()
    const dialogRef = useRef(null)

    // Helper to format category names in Title Case
    const formatCategoryName = (category) => {
        return t(category)
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    // Get subcategories for the current category (calculated on render, not memoized)
    const getSubcategories = () => {
        if (!dataManager.getItemTypeMap) return []
        const typeMap = dataManager.getItemTypeMap()

        let categories = []

        // If itemType is specified, return only its subcategories
        if (itemType && typeMap[itemType]) {
            categories = [...typeMap[itemType]]

            // Add Mr Handy Weapons category if character is Mr Handy and we're in weapon category
            if (itemType === 'weapon' && character?.origin === 'mrHandy') {
                categories.push('mrHandyWeapons')
            }
        } else {
            // Otherwise return all subcategories
            categories = [
                ...typeMap.weapon,
                ...typeMap.apparel,
                ...typeMap.aid,
                ...typeMap.other
            ]

            // Add Mr Handy Weapons category if character is Mr Handy
            if (character?.origin === 'mrHandy') {
                categories.push('mrHandyWeapons')
            }
        }

        // Sort alphabetically by translated name
        return categories.sort((a, b) => {
            const nameA = formatCategoryName(a)
            const nameB = formatCategoryName(b)
            return nameA.localeCompare(nameB)
        })
    }

    // Update available items when itemType, typeFilter, rarityFilter, or dataManager changes
    useEffect(() => {
        if (!isOpen || !dataManager.getItem) {
            setAvailableItems([])
            return
        }

        let allItems = []

        // Determine which items to show based on category and filter
        if (typeFilter === 'all') {
            // Show all items from the category (or all categories if no category specified)
            if (itemType) {
                // Show all items from this category
                const categoryData = dataManager[itemType] || {}
                allItems = Object.values(categoryData)
            } else {
                // Show all items from all categories
                allItems = [
                    ...Object.values(dataManager.weapon || {}),
                    ...Object.values(dataManager.apparel || {}),
                    ...Object.values(dataManager.aid || {}),
                    ...Object.values(dataManager.other || {})
                ]
            }
        } else if (typeFilter === 'mrHandyWeapons') {
            // Special filter for Mr Handy weapons (virtual category)
            const weaponData = dataManager.weapon || {}
            allItems = Object.values(weaponData).filter(item => {
                const qualities = item.QUALITIES || []
                return qualities.includes('qualityMrHandyOnly')
            })
        } else {
            // Filter by specific subtype
            const typeMap = dataManager.getItemTypeMap()

            // Determine which main category this subtype belongs to
            let mainCategory = null
            for (const [category, subtypes] of Object.entries(typeMap)) {
                if (subtypes.includes(typeFilter)) {
                    mainCategory = category
                    break
                }
            }

            if (mainCategory) {
                const categoryData = dataManager[mainCategory] || {}
                allItems = Object.values(categoryData).filter(item => item.TYPE === typeFilter)
            }
        }

        // Exclude unacquirable items
        allItems = allItems.filter(item => !dataManager.isUnacquirable(item.ID))

        // Exclude Mr Handy only weapons from regular categories (unless we're in mrHandyWeapons filter)
        if (typeFilter !== 'mrHandyWeapons') {
            allItems = allItems.filter(item => {
                const qualities = item.QUALITIES || []
                return !qualities.includes('qualityMrHandyOnly')
            })
        }

        // Filter by rarity (show items with rarity <= selected rarity)
        if (rarityFilter !== 'all') {
            const maxRarity = parseInt(rarityFilter)
            allItems = allItems.filter(item => {
                const itemRarity = parseInt(item.RARITY) || 0
                return itemRarity <= maxRarity
            })
        }

        // Add side variations for items that need them (arms/legs)
        const itemsWithSides = []
        allItems.forEach(item => {
            let suffixes = ['']
            if (item.ID.endsWith('Arm') || item.ID.endsWith('Leg')) {
                suffixes = ['_left', '_right']
            }

            suffixes.forEach(suffix => {
                itemsWithSides.push({
                    ...item,
                    DISPLAY_ID: `${item.ID}${suffix}`,
                    SIDE_SUFFIX: suffix
                })
            })
        })

        // Sort items alphabetically by translated name
        const sortedItems = itemsWithSides.sort((a, b) => {
            let nameA = t(a.ID)
            let nameB = t(b.ID)

            // Add side suffix to name for sorting
            if (a.SIDE_SUFFIX) {
                const sideText = a.SIDE_SUFFIX.replace('_', '')
                nameA += ` (${t(sideText)})`
            }
            if (b.SIDE_SUFFIX) {
                const sideText = b.SIDE_SUFFIX.replace('_', '')
                nameB += ` (${t(sideText)})`
            }

            return nameA.localeCompare(nameB)
        })

        setAvailableItems(sortedItems)

        // Set first item as default selection
        if (sortedItems.length > 0) {
            setSelectedItemId(sortedItems[0].DISPLAY_ID)
            setSelectedItemType(sortedItems[0].TYPE)
        }
    }, [isOpen, itemType, typeFilter, rarityFilter])

    // Handle dialog open/close
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen) {
            dialog.showModal()
            // Reset form when opening
            setQuantity(1)
            setTypeFilter('all') // Reset filter when popup opens
            setRarityFilter('all') // Reset rarity filter when popup opens
            setShouldBuy(false) // Reset buy checkbox when popup opens
        } else {
            dialog.close()
        }
    }, [isOpen])

    // Reset filter when itemType changes (e.g., switching from weapon to apparel)
    useEffect(() => {
        if (isOpen) {
            setTypeFilter('all')
            setRarityFilter('all')
        }
    }, [itemType, isOpen])

    const handleClose = () => {
        const dialog = dialogRef.current
        if (dialog && dialog.open) {
            // Add closing animation class
            dialog.classList.add('dialog-closing')
            dialog.addEventListener(
                'animationend',
                () => {
                    dialog.classList.remove('dialog-closing')
                    if (dialog.open) {
                        dialog.close()
                    }
                    onClose()
                },
                { once: true }
            )
        } else {
            onClose()
        }
    }

    const handleConfirm = () => {
        if (!selectedItemId || !selectedItemType || quantity <= 0) return

        // Get the selected item data to check cost
        const selectedItem = availableItems.find(item => item.DISPLAY_ID === selectedItemId)
        if (!selectedItem) return

        // Calculate total cost if buying
        let totalCost = 0
        if (shouldBuy) {
            const itemCost = parseInt(selectedItem.COST) || 0
            totalCost = itemCost * quantity

            // Check if character has enough caps
            const currentCaps = character.caps || 0
            if (currentCaps < totalCost) {
                // Not enough caps - could show an alert here
                return
            }
        }

        // Add item to character inventory
        const newItem = {
            id: selectedItemId, // This will be the DISPLAY_ID (with _left/_right if applicable)
            type: selectedItemType, // Use the actual TYPE of the selected item
            quantity: quantity,
            equipped: false,
            mods: [] // New items have no mods
        }

        // Check if item with same configuration already exists in inventory
        // This considers both id AND mods, so modified weapons are separate from unmodified ones
        const existingItems = character.items || []
        const existingItemIndex = existingItems.findIndex(item =>
            isSameConfiguration(item, newItem)
        )

        let updatedItems
        if (existingItemIndex >= 0) {
            // Same configuration exists, increase quantity
            updatedItems = [...existingItems]
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: updatedItems[existingItemIndex].quantity + quantity
            }
        } else {
            // New configuration, add to inventory
            updatedItems = [...existingItems, newItem]
        }

        // Deduct caps if buying
        const updates = { items: updatedItems }
        if (shouldBuy) {
            updates.caps = (character.caps || 0) - totalCost
        }

        updateCharacter(updates)
        handleClose()
    }

    const handleQuantityChange = (e) => {
        const val = parseInt(e.target.value)
        setQuantity(val ? Math.max(1, val) : '')
    }

    const handleBackdropClick = (e) => {
        if (e.target === dialogRef.current) {
            handleClose()
        }
    }

    return (
        <dialog
            ref={dialogRef}
            onClick={handleBackdropClick}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <header className="l-lastSmall">
                    <span className="h2">{t('chooseItem')}</span>
                    <button className="popup__button-x" onClick={handleClose}>
                        &times;
                    </button>
                </header>

                <hr />

                {/* Type Filter - show subcategories for the current category */}
                <div className="row" style={{ marginBottom: '1rem' }}>
                    <label style={{ marginRight: '0.5rem' }}>{t('type')}:</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        aria-label="Type filter"
                    >
                        <option value="all">{t('all')}</option>
                        {getSubcategories().map(subtype => (
                            <option key={subtype} value={subtype}>
                                {formatCategoryName(subtype)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Rarity Filter */}
                <div className="row" style={{ marginBottom: '1rem' }}>
                    <label style={{ marginRight: '0.5rem' }}>{t('rarity')}:</label>
                    <select
                        value={rarityFilter}
                        onChange={(e) => setRarityFilter(e.target.value)}
                        aria-label="Rarity filter"
                    >
                        <option value="all">{t('all')}</option>
                        <option value="0">{t('rarity0')}</option>
                        <option value="1">{t('rarity1')}</option>
                        <option value="2">{t('rarity2')}</option>
                        <option value="3">{t('rarity3')}</option>
                        <option value="4">{t('rarity4')}</option>
                    </select>
                </div>

                <div className="row">
                    <select
                        value={selectedItemId}
                        onChange={(e) => {
                            const selectedId = e.target.value
                            setSelectedItemId(selectedId)
                            // Find the item and set its TYPE
                            const item = availableItems.find(i => i.DISPLAY_ID === selectedId)
                            if (item) {
                                setSelectedItemType(item.TYPE)
                            }
                        }}
                        aria-label="Object picker"
                    >
                        {availableItems.map(item => {
                            let displayName = t(item.ID)
                            if (item.SIDE_SUFFIX) {
                                const sideText = item.SIDE_SUFFIX.replace('_', '')
                                displayName += ` (${t(sideText)})`
                            }
                            return (
                                <option key={item.DISPLAY_ID} value={item.DISPLAY_ID}>
                                    {displayName}
                                </option>
                            )
                        })}
                    </select>

                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={handleQuantityChange}
                        aria-label="Object quantity"
                        style={{ width: '5rem' }}
                    />
                </div>

                {/* Buy checkbox and price */}
                <div className="row" style={{ marginTop: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('buy')}?
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            className="themed-svg"
                            data-icon="caps"
                            checked={shouldBuy}
                            onChange={(e) => setShouldBuy(e.target.checked)}
                            style={{
                                width: '1.2rem',
                                height: '1.2rem'
                            }}
                        />
                        <span style={{
                            color: shouldBuy ? 'var(--primary-color)' : 'var(--primary-color-very-translucent)',
                            fontWeight: 'bold'
                        }}>
                            {(() => {
                                const selectedItem = availableItems.find(item => item.DISPLAY_ID === selectedItemId)
                                const itemCost = selectedItem ? (parseInt(selectedItem.COST) || 0) : 0
                                const totalCost = itemCost * quantity
                                return totalCost
                            })()}
                        </span>
                    </label>
                </div>

                <hr />
                
                <footer>
                    <button 
                        className="popup__button-confirm"
                        onClick={handleConfirm}
                        disabled={!selectedItemId || quantity <= 0}
                    >
                        {t('confirm')}
                    </button>
                    <button 
                        className="popup__button-close"
                        onClick={handleClose}
                    >
                        {t('close')}
                    </button>
                </footer>
            </div>
        </dialog>
    )
}

export default AddItemPopup
