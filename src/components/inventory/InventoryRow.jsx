import React, { useState, useRef, useEffect } from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useOverlay } from '../../hooks/useOverlay.js'
import { useInventoryActions } from '../../hooks/useInventoryActions.js'
import { useDataManager } from '../../hooks/useDataManager.js'
import { getDisplayName } from '../../utils/itemUtils.js'
import { SKILLS } from '../../js/constants.js'

/**
 * Compact inventory row that expands to show full card
 * Accordion-style interaction for mobile-friendly inventory browsing
 */
function InventoryRow({ 
    characterItem, 
    itemData, 
    isExpanded, 
    onToggle,
    cardComponent: CardComponent,
    showBadges = true
}) {
    const t = useI18n()
    const contentRef = useRef(null)
    const [contentHeight, setContentHeight] = useState(0)
    const { sellItem, deleteItem, equipItem, useItem } = useInventoryActions()
    const dataManager = useDataManager()

    // Check if item can be sold/deleted (unacquirable items cannot)
    const [itemId] = characterItem.id.split('_')
    const canSellDelete = !dataManager.isUnacquirable(itemId)

    // Use overlay hook for sell/delete functionality (only if item can be sold/deleted)
    const {
        showOverlay,
        handleHideOverlay,
        handleSell,
        handleDelete,
        longPressHandlers
    } = useOverlay(
        canSellDelete ? () => sellItem(characterItem, itemData) : null,
        canSellDelete ? () => deleteItem(characterItem, itemData) : null
    )

    // Calculate content height for smooth animation
    useEffect(() => {
        if (contentRef.current && isExpanded) {
            // Use ResizeObserver to track content height changes (e.g., when description expands)
            const resizeObserver = new ResizeObserver(() => {
                if (contentRef.current) {
                    setContentHeight(contentRef.current.scrollHeight)
                }
            })

            resizeObserver.observe(contentRef.current)

            // Initial height calculation
            setContentHeight(contentRef.current.scrollHeight)

            return () => {
                resizeObserver.disconnect()
            }
        }
    }, [isExpanded, characterItem, itemData])

    if (!itemData) {
        return null
    }

    const [, side] = characterItem.id.split('_')
    const quantity = characterItem.quantity

    // Determine item type for icon
    const getItemIcon = () => {
        const itemType = characterItem.type

        // Weapon types - use specific weapon type icons
        if (Object.values(SKILLS).includes(itemType)) {
            return itemType // smallGuns, energyWeapons, bigGuns, meleeWeapons, etc.
        }

        // Apparel types
        if (['clothing', 'headgear', 'outfit'].includes(itemType) || itemType.endsWith('Armor')) {
            return 'armor'
        }

        // Aid types - use specific aid type icons
        if (itemType === 'food') {
            return 'food'
        }
        if (itemType === 'drinks') {
            return 'drinks'
        }
        if (itemType === 'meds') {
            return 'meds'
        }

        // Ammo
        if (itemType === 'ammo') {
            return 'caps' // Using caps icon as placeholder for ammo
        }

        return 'caps' // Default fallback
    }

    // Get item subinfo (type, damage, DR, etc.)
    const getItemSubInfo = () => {
        const itemType = characterItem.type
        
        // Weapon - show damage and type
        if (Object.values(SKILLS).includes(itemType)) {
            return `${t(itemType)} • ${itemData.DAMAGE_RATING} ${t(itemData.DAMAGE_TYPE)}`
        }
        
        // Apparel - show DR as "Physical - Energy - Radiation"
        if (['clothing', 'headgear', 'outfit'].includes(itemType) || itemType.endsWith('Armor')) {
            const physical = itemData.PHYSICAL_RES || 0
            const energy = itemData.ENERGY_RES || 0
            const radiation = itemData.RADIATION_RES || 0
            return `${t('damageReduction')}: ${physical} - ${energy} - ${radiation}`
        }
        
        // Aid - show effect
        if (['food', 'drinks', 'meds'].includes(itemType)) {
            return itemData.EFFECT || t(itemType)
        }
        
        // Ammo - show type
        if (itemType === 'ammo') {
            return t('ammo')
        }
        
        return t(itemType)
    }

    // Check if item has special badges
    const getBadges = () => {
        const badges = []

        // Equipped badge - show icon instead of text
        if (characterItem.equipped) {
            badges.push({ type: 'equipped', icon: 'armor', color: 'success' })
        }

        // Low ammo warning for weapons
        if (Object.values(SKILLS).includes(characterItem.type) && itemData.AMMO_TYPE !== 'na') {
            // This would need character context to check actual ammo
            // For now, just a placeholder
        }

        return badges
    }

    const handleRowClick = (e) => {
        // Don't toggle if clicking inside the expanded card
        if (isExpanded && e.target.closest('.inventory-row__card')) {
            return
        }
        onToggle()
    }

    const badges = showBadges ? getBadges() : []

    // Calculate text length for dynamic font sizing
    // Use getDisplayName to show [+N] for modded items (except robot parts)
    const itemName = getDisplayName(characterItem, t, dataManager) + (side ? ` (${t(side)})` : '')
    const nameLength = itemName.length
    let nameSizeClass = ''
    if (nameLength > 50) {
        nameSizeClass = 'text-xs'
    } else if (nameLength > 40) {
        nameSizeClass = 'text-sm'
    } else if (nameLength > 30) {
        nameSizeClass = 'text-md'
    }

    return (
        <div
            className={`inventory-row ${isExpanded ? 'expanded' : ''}`}
            {...longPressHandlers}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Compact Row Header */}
            <div
                className="inventory-row__header"
                onClick={handleRowClick}
            >
                <div className="inventory-row__icon themed-svg" data-icon={getItemIcon()}></div>

                <div className="inventory-row__info">
                    <div className="inventory-row__name">
                        <span className={`inventory-row__name-text ${nameSizeClass}`}>
                            {itemName}
                        </span>
                        {badges.length > 0 && (
                            <span className="inventory-row__badges">
                                {badges.map((badge, index) => (
                                    <span
                                        key={index}
                                        className={`inventory-row__badge badge-${badge.color}`}
                                        title={badge.icon ? t('equipped') : ''}
                                    >
                                        {badge.icon ? (
                                            <div className="themed-svg" data-icon={badge.icon}></div>
                                        ) : (
                                            badge.label
                                        )}
                                    </span>
                                ))}
                            </span>
                        )}
                    </div>
                    <div className="inventory-row__subinfo">
                        {getItemSubInfo()}
                    </div>
                </div>
                
                <div className="inventory-row__quantity">
                    <span>{quantity}x</span>
                </div>
                
                <div className="inventory-row__expand">
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                </div>
            </div>

            {/* Expandable Card Content */}
            <div 
                className="inventory-row__content"
                style={{ 
                    maxHeight: isExpanded ? `${contentHeight}px` : '0px'
                }}
            >
                <div ref={contentRef} className="inventory-row__card">
                    {isExpanded && CardComponent && (
                        <CardComponent
                            characterItem={characterItem}
                            itemData={itemData}
                            onEquip={(item, data) => equipItem(item, data)}
                            onConsume={(item, data) => useItem(item, data)}
                        />
                    )}
                </div>
            </div>

            {/* Sell/Delete Overlay - shown on long press (only for items that can be sold/deleted) */}
            {canSellDelete && (
                <div className={`card-overlay ${showOverlay ? '' : 'hidden'}`} onClick={handleHideOverlay}>
                    <button
                        className="popup__button-confirm"
                        data-icon="caps"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleSell()
                        }}
                        title={t('sell')}
                    >
                        <img src="img/svg/caps.svg" alt="Sell" />
                    </button>
                    <button
                        className="delete-button"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDelete()
                        }}
                        title={t('delete')}
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            )}
        </div>
    )
}

export default InventoryRow
