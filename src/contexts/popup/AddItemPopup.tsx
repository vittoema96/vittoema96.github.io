import {useEffect, useRef, useState} from 'react'
import { useTranslation } from 'react-i18next'
import {useCharacter} from '@/contexts/CharacterContext'
import {useDialog} from '@/hooks/useDialog'
import {isSameConfiguration} from '@/utils/itemUtils'
import {ORIGINS} from "@/utils/characterSheet";
import {getGameDatabase} from "@/hooks/getGameDatabase"
import {CharacterItem, GenericItem, GenericPopupProps, ItemCategory, ItemType, Side} from "@/types";

export interface AddItemPopupProps extends GenericPopupProps {
    itemType: ItemType;
}

type CategoryFilter = ItemCategory | 'mrHandyWeapons' | undefined;

type SelectableItem = GenericItem & {variant?: Side | undefined} | undefined

/**
 * Add Item popup component for adding items to inventory
 * itemType can be a category ('weapon', 'apparel', 'aid', 'other') or null for all items
 */
function AddItemPopup({ onClose, itemType}: Readonly<AddItemPopupProps>) {
    const { t } = useTranslation()
    const [selectedItem, setSelectedItem] = useState<SelectableItem>(undefined)
    const [quantity, setQuantity] = useState<number | ''>(1)
    const [availableItems, setAvailableItems] = useState<SelectableItem[]>([])
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(undefined) // all, or specific subtype
    const [rarityFilter, setRarityFilter] = useState<number | undefined>(undefined) // all, or max rarity level
    const [shouldBuy, setShouldBuy] = useState(false) // Whether to deduct caps

    const { character, updateCharacter } = useCharacter()
    const dataManager = getGameDatabase()
    const dialogRef = useRef<HTMLDialogElement>(null)


    // Get subcategories for the current category (calculated on render, not memoized)
    const getCategories = () => {
        const typeMap = dataManager.getItemTypeMap()
        const hasToAddMrHandyWeapons = itemType === 'weapon' && character.origin === ORIGINS.MR_HANDY
        const categories: CategoryFilter[] = [
            ...typeMap[itemType],
            ...(hasToAddMrHandyWeapons ? ['mrHandyWeapons' as const] : [])
        ]

        // Sort alphabetically by translated name
        return categories.toSorted((a, b) => {
            if(!a && !b) {return 0}
            if(!a) {return 1}
            if(!b) {return -1}
            return t(a).localeCompare(t(b))
        }).map(categoryFilter => {
            return <option key={categoryFilter} value={categoryFilter}>
                        {t(categoryFilter || 'all')}
                   </option>
        })
    }

    // Update available items when itemType, categoryFilter, rarityFilter, or dataManager changes
    useEffect(() => {
        let allItems = Object.values(dataManager[itemType] || {})

        if(categoryFilter) {
            allItems = allItems.filter(item => {
                if(dataManager.isType(item, "weapon")){
                    const hasMrHandyWeaponsFilter = categoryFilter === 'mrHandyWeapons'
                    const hasMrHandyOnlyQuality = (item.QUALITIES || []).includes('qualityMrHandyOnly')
                    return hasMrHandyWeaponsFilter
                        ? hasMrHandyOnlyQuality  // Only check quality
                        : item.CATEGORY === categoryFilter && !hasMrHandyOnlyQuality

                }
                return item.CATEGORY === categoryFilter
            })
        }

        // Exclude unacquirable items
        allItems = allItems.filter(item => !dataManager.isUnacquirable(item.ID))

        // TODO might want to add a == or <= toggle for rarity
        // Filter by rarity (show items with rarity <= selected rarity)
        if (rarityFilter) {
            const maxRarity = rarityFilter
            allItems = allItems.filter(item => {
                const itemRarity = item.RARITY || 0
                return itemRarity <= maxRarity
            })
        }

        // TODO fix this mess with sides in CharacterItem or something similar
        // Add side variations for items that need them (arms/legs)
        const itemsWithVariants: SelectableItem[] = []
        allItems.forEach(item => {
            let variants: (Side|undefined)[] = [undefined]
            // TODO might use LOCATIONS_COVERED contains "leg" or "arm" instead
            if (item.ID.endsWith('Arm') || item.ID.endsWith('Leg')) {
                variants = ['left', 'right']
            }

            variants.forEach(variant => {
                itemsWithVariants.push({
                    ...item,
                    variant: variant
                })
            })
        })

        // Sort items alphabetically by translated name
        const sortedItems = itemsWithVariants.toSorted((a, b) => {

            const getName = (item: SelectableItem) => {
                if(!item) {return ''}
                let name = t(item.ID)
                if(item.variant){
                    name += ` (${t(item.variant)})`
                }
                return name
            }
            const nameA = getName(a)
            const nameB = getName(b)

            return nameA.localeCompare(nameB)
        })

        setAvailableItems(sortedItems)

        // Set first item as default selection
        if (sortedItems.length > 0) {
            setSelectedItem(sortedItems[0])
        }
    }, [itemType, categoryFilter, rarityFilter])

    // Use dialog hook for dialog management
    const { closeWithAnimation } = useDialog(dialogRef, onClose)

    // Reset form when opening (runs on mount)
    useEffect(() => {
        setQuantity(1)
        setCategoryFilter(undefined)
        setRarityFilter(undefined)
        setShouldBuy(false)
    }, [])

    // Reset filter when itemType changes (e.g., switching from weapon to apparel)
    useEffect(() => {
        setCategoryFilter(undefined)
        setRarityFilter(undefined)
    }, [itemType])

    const handleClose = () => {
        closeWithAnimation()
    }

    const handleConfirm = () => {
        if (!selectedItem || !quantity) {return}

        // Calculate total cost if buying
        let totalCost = 0
        if (shouldBuy) {
            const itemCost = selectedItem.COST || 0
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
            id: selectedItem.ID, // This will be the DISPLAY_ID (with _left/_right if applicable)
            type: selectedItem.TYPE, // Use the actual TYPE of the selected item
            variant: selectedItem.variant,
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

        let updatedItems: CharacterItem[]
        if (existingItemIndex >= 0) {
            // Same configuration exists, increase quantity
            updatedItems = [...existingItems]
            if(updatedItems[existingItemIndex]){
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: updatedItems[existingItemIndex].quantity + quantity
                }
            }
        } else {
            // New configuration, add to inventory
            updatedItems = [...existingItems, newItem]
        }

        updateCharacter({
            items: updatedItems,
            ...(shouldBuy && { caps: (character.caps || 0) - totalCost })
        })
        handleClose()
    }

    const handleQuantityChange = (e) => {
        const val = Number.parseInt(e.target.value)
        setQuantity(val ? Math.max(1, val) : '')
    }

    return (
        <dialog
            ref={dialogRef}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <header className="l-lastSmall">
                    <span className="h2">{t('chooseItem')}</span>
                    <button className="popup__button-x" onClick={handleClose}>
                        &times;
                    </button>
                </header>

                <hr />

                {/* Category Filter */}
                <div className="row" style={{ marginBottom: '1rem' }}>
                    <label style={{ marginRight: '0.5rem' }}>{t('type')}:</label>
                    <select
                        value={categoryFilter ?? 'all'}
                        onChange={(e) => {
                            const value = e.target.value
                            const filter = value === 'all' ? undefined : value as CategoryFilter
                            setCategoryFilter(filter)
                        }}
                        aria-label="Type filter"
                    >
                        <option value={'all'}>{t('all')}</option>
                        {getCategories()}
                    </select>
                </div>

                {/* Rarity Filter */}
                <div className="row" style={{ marginBottom: '1rem' }}>
                    <label style={{ marginRight: '0.5rem' }}>{t('rarity')}:</label>
                    <select
                        value={rarityFilter ?? 'all'}
                        onChange={(e) => {
                            const value = e.target.value
                            const filter = value === 'all' ? undefined : Number.parseInt(value)
                            setRarityFilter(filter)
                        }}
                        aria-label="Rarity filter"
                    >
                        <option value={'all'}>{t('all')}</option>
                        <option value={0}>{t('rarity0')}</option>
                        <option value={1}>{t('rarity1')}</option>
                        <option value={2}>{t('rarity2')}</option>
                        <option value={3}>{t('rarity3')}</option>
                        <option value={4}>{t('rarity4')}</option>
                    </select>
                </div>

                <div className="row">
                    <select
                        onChange={(e) => {
                            const item = availableItems.find(i => {
                                const id = `${i?.ID ?? ''}_${i?.variant ?? ''}`
                                return id === e.target.value
                            })
                            setSelectedItem(item)
                        }}
                        aria-label="Object picker"
                    >
                        {availableItems.map(item => {
                            let displayName = item ? t(item.ID) : '-'
                            if (item?.variant) {
                                displayName += ` (${t(item.variant)})`
                            }
                            const id = `${item?.ID ?? ''}_${item?.variant ?? ''}`
                            return (
                                <option key={id} value={id}>
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
                                const itemCost = selectedItem ? (selectedItem.COST || 0) : 0
                                return itemCost * quantity
                            })()}
                        </span>
                    </label>
                </div>

                <hr />

                <footer>
                    <button
                        className="popup__button-confirm"
                        onClick={handleConfirm}
                        disabled={!selectedItem || !quantity}
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
