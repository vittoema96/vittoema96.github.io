import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useCharacter } from '../../contexts/CharacterContext.jsx'

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

    // Get subcategories for the current category
    const getSubcategoriesForCategory = () => {
        if (!dataManager.getItemTypeMap) return []
        const typeMap = dataManager.getItemTypeMap()

        // If itemType is specified, return only its subcategories
        if (itemType && typeMap[itemType]) {
            return typeMap[itemType]
        }

        // Otherwise return all subcategories
        return [
            ...typeMap.weapon,
            ...typeMap.apparel,
            ...typeMap.aid,
            ...typeMap.other
        ]
    }

    // Update available items when itemType, typeFilter, or dataManager changes
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

        setAvailableItems(itemsWithSides)

        // Set first item as default selection
        if (itemsWithSides.length > 0) {
            setSelectedItemId(itemsWithSides[0].DISPLAY_ID)
            setSelectedItemType(itemsWithSides[0].TYPE)
        }
    }, [isOpen, itemType, typeFilter, dataManager])

    // Handle dialog open/close
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen) {
            dialog.showModal()
            // Reset form when opening
            setQuantity(1)
        } else {
            dialog.close()
        }
    }, [isOpen])

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

        // Add item to character inventory
        const newItem = {
            id: selectedItemId, // This will be the DISPLAY_ID (with _left/_right if applicable)
            type: selectedItemType, // Use the actual TYPE of the selected item
            quantity: quantity,
            equipped: false
        }

        // Check if item already exists in inventory
        const existingItems = character.items || []
        const existingItemIndex = existingItems.findIndex(item => item.id === selectedItemId)

        let updatedItems
        if (existingItemIndex >= 0) {
            // Item exists, increase quantity
            updatedItems = [...existingItems]
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: updatedItems[existingItemIndex].quantity + quantity
            }
        } else {
            // New item, add to inventory
            updatedItems = [...existingItems, newItem]
        }

        updateCharacter({ items: updatedItems })
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
                    <label style={{ marginRight: '0.5rem' }}>{t('filterByType')}:</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        aria-label="Type filter"
                    >
                        <option value="all">{t('all')}</option>
                        {itemType ? (
                            // Show only subcategories for this category
                            getSubcategoriesForCategory().map(subtype => (
                                <option key={subtype} value={subtype}>
                                    {formatCategoryName(subtype)}
                                </option>
                            ))
                        ) : (
                            // Show all subcategories grouped by category
                            <>
                                <optgroup label={t('weaponsUpper')}>
                                    {dataManager.getItemTypeMap && dataManager.getItemTypeMap().weapon.map(subtype => (
                                        <option key={subtype} value={subtype}>
                                            {formatCategoryName(subtype)}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label={t('apparelUpper')}>
                                    {dataManager.getItemTypeMap && dataManager.getItemTypeMap().apparel.map(subtype => (
                                        <option key={subtype} value={subtype}>
                                            {formatCategoryName(subtype)}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label={t('aidUpper')}>
                                    {dataManager.getItemTypeMap && dataManager.getItemTypeMap().aid.map(subtype => (
                                        <option key={subtype} value={subtype}>
                                            {formatCategoryName(subtype)}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label={t('otherUpper')}>
                                    {dataManager.getItemTypeMap && dataManager.getItemTypeMap().other.map(subtype => (
                                        <option key={subtype} value={subtype}>
                                            {formatCategoryName(subtype)}
                                        </option>
                                    ))}
                                </optgroup>
                            </>
                        )}
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
