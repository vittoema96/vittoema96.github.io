import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useOverlay } from '@/hooks/useOverlay.ts'
import { useInventoryActions } from '@/features/inv/hooks/useInventoryActions.ts'
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { getDisplayName } from '@/utils/itemUtils.ts'
import {CharacterItem, CustomItem} from '@/types'
import { FitText } from '@/components/FitText.tsx';


interface InventoryRowProps {
    characterItem?: CharacterItem
    customItem?: CustomItem
    isSelected: boolean
    onSelect: () => void
    cardComponent: React.ComponentType<any>
    showBadges?: boolean
}
/**
 * Compact inventory row that can be selected to display details in a dedicated area
 * Click to select/deselect, long press for sell/delete/rename options
 * Supports both database items (CharacterItem) and custom items (CustomItem)
 */
function InventoryRow({
    characterItem,
    customItem,
    isSelected,
    onSelect,
    cardComponent: CardComponent,
    showBadges = true
}: Readonly<InventoryRowProps>) {
    const { t } = useTranslation()

    // Handle custom items (simplified rendering)
    if (customItem) {
        return (
            <div
                className={`inventory-row ${isSelected ? 'selected' : ''}`}
                onClick={onSelect}
            >
                <div className="inventory-row__header">
                    <div className="inventory-row__icon themed-svg" data-icon="caps"></div>

                    <div className="inventory-row__info">
                        <div className="inventory-row__name">
                            <FitText center={false} wrap={true} maxSize={15}>
                                {customItem.name}
                            </FitText>
                        </div>
                        <div className="inventory-row__subinfo">
                            <FitText center={false} wrap={true} minSize={8} maxSize={10}>
                                {t(customItem.category)}
                            </FitText>
                        </div>
                    </div>

                    {customItem.quantity > 0 && (
                        <div className="inventory-row__quantity">
                            <span>{customItem.quantity}x</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Handle database items (CharacterItem)
    if (!characterItem) {
        console.error('InventoryRow: neither characterItem nor customItem provided');
        return null;
    }

    const nameInputRef = useRef<HTMLInputElement>(null)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState(characterItem.customName || '')
    const { sellItem, deleteItem, updateItemCustomName } = useInventoryActions()
    const dataManager = getGameDatabase()
    let itemData = dataManager.getItem(characterItem.id)

    if(dataManager.isType(itemData, "moddable")){
        itemData = getModifiedItemData(characterItem)
    }

    // Check if item can be sold/deleted (unacquirable items cannot)
    const canSellDelete = !dataManager.isUnacquirable(itemData?.ID || '')

    // Check if item supports custom naming (weapons and apparel only)
    const supportsCustomName = dataManager.isType(itemData, 'weapon') || dataManager.isType(itemData, 'apparel')

    // Use overlay hook for sell/delete functionality (only if item can be sold/deleted)
    const {
        showOverlay,
        handleHideOverlay,
        handleSell,
        handleDelete,
        longPressHandlers
    } = useOverlay(
        canSellDelete ? () => sellItem(characterItem) : null,
        canSellDelete ? () => deleteItem(characterItem) : null
    )

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus()
            nameInputRef.current.select()
        }
    }, [isEditingName])

    const handleStartRename = () => {
        setEditedName(characterItem.customName || '')
        setIsEditingName(true)
        handleHideOverlay()
    }

    const handleSaveName = () => {
        updateItemCustomName(characterItem, editedName)
        setIsEditingName(false)
    }

    const handleCancelEditing = () => {
        setEditedName(characterItem.customName || '')
        setIsEditingName(false)
    }

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveName()
        } else if (e.key === 'Escape') {
            handleCancelEditing()
        }
    }

    if(!itemData) {
        console.error(`Item data not found for ID: ${characterItem.id}`);
        return null;
    }

    const quantity = characterItem.quantity

    // Determine item type for icon
    const getItemIcon = () => {
        // Weapon and Aid use their category
        if (dataManager.isType(itemData, "weapon") || dataManager.isType(itemData, "aid")) {
            return itemData.CATEGORY
        }
        // Apparel types FOR NOW use all the same icon TODO
        if (dataManager.isType(itemData, "apparel")) {
            return 'armor'
        }
        return 'caps' // Default fallback
    }

    // Get item subinfo (type, damage, DR, etc.)
    const getItemSubInfo = () => {
        // Weapon - show damage and type
        if (dataManager.isType(itemData, "weapon")) {
            return `${t(itemData.CATEGORY)} • ${itemData.DAMAGE_RATING} ${t(itemData.DAMAGE_TYPE)}`
        }


        if(dataManager.isType(itemData, "apparel")){
            const physical = itemData.PHYSICAL_RES
            const energy = itemData.ENERGY_RES
            const radiation = itemData.RADIATION_RES === Infinity ? t('immune') : itemData.RADIATION_RES
            return `${t('damageReduction')}: ${physical} - ${energy} - ${radiation}`

        }

        // TODO improve subinfo
        if (dataManager.isType(itemData, "aid")) {
            return t(itemData.EFFECT) || t(itemData.CATEGORY)
        }
        return t(itemData.CATEGORY || "ERROR")
    }

    // Check if item has special badges
    const getBadges = () => {
        const badges = []

        // Equipped badge - show icon instead of text
        if (characterItem.equipped) {
            badges.push({ type: 'equipped', icon: 'armor', color: 'success' })
        }

        return badges
    }

    const handleRowClick = () => {
        onSelect()
    }

    const badges = showBadges ? getBadges() : []

    // Calculate text length for dynamic font sizing
    // Use getDisplayName to show [+N] for modded items (except robot parts)
    const itemName = getDisplayName(characterItem, t)

    return (
        <div
            className={`inventory-row ${isSelected ? 'selected' : ''}`}
            {...longPressHandlers}
            onContextMenu={e => e.preventDefault()}
        >
            {/* Compact Row Header */}
            <div className="inventory-row__header" onClick={handleRowClick}>
                <div className="inventory-row__icon themed-svg" data-icon={getItemIcon()}></div>

                <div className="inventory-row__info">
                    <div className="inventory-row__name">
                        {isEditingName ? (
                            <input
                                ref={nameInputRef}
                                type="text"
                                className="inventory-row__name-input"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                                onBlur={handleSaveName}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={t(characterItem.id)}
                            />
                        ) : (
                            <>
                                <FitText center={false} wrap={true} maxSize={15}>
                                    {itemName}
                                </FitText>
                                {badges.length > 0 && (
                                    <span className="inventory-row__badges">
                                        {badges.map(badge => (
                                            <span
                                                key={characterItem.id + badge.icon}
                                                className={`inventory-row__badge badge-${badge.color}`}
                                                title={badge.icon ? t('equipped') : ''}
                                            >
                                                <div className="themed-svg" data-icon={badge.icon}></div>
                                            </span>
                                        ))}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <div className="inventory-row__subinfo">
                        <FitText center={false} wrap={true} minSize={8} maxSize={10}>
                            {getItemSubInfo()}
                        </FitText>
                    </div>
                </div>

                {quantity > 0 && (
                    <div className="inventory-row__quantity">
                        <span>{quantity}x</span>
                    </div>
                )}
            </div>

            {/* Sell/Delete/Rename Overlay - shown on long press */}
            {(canSellDelete || supportsCustomName) && (
                <div
                    className={`card-overlay ${showOverlay ? '' : 'hidden'}`}
                    onClick={handleHideOverlay}
                >
                    {supportsCustomName && (
                        <button
                            className="rename-button"
                            onClick={e => {
                                e.stopPropagation();
                                handleStartRename();
                            }}
                            title={t('editItemName')}
                        >
                            <i className="fas fa-pen"></i>
                        </button>
                    )}
                    {canSellDelete && (
                        <button
                            className="confirmButton"
                            data-icon="caps"
                            onClick={e => {
                                e.stopPropagation();
                                handleSell();
                            }}
                            title={t('sell')}
                        >
                            <img src="img/svg/caps.svg" alt="Sell" />
                        </button>
                    )}
                    {canSellDelete && (
                        <button
                            className="delete-button"
                            onClick={e => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                            title={t('delete')}
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default InventoryRow
