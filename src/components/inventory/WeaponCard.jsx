import React, { useState } from 'react'
import BaseCard from './BaseCard.jsx'
import WeaponContent from './content/WeaponContent.jsx'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { usePopup } from '../../contexts/PopupContext.jsx'
import { useI18n } from '../../hooks/useI18n.js'
import { canBeModified } from '../../utils/itemUtils.js'
import { getWeaponAmmoCount, getWeaponAmmoPerShot, hasEnoughAmmo as checkHasEnoughAmmo } from '../../utils/weaponUtils.js'

/**
 * Weapon card component with weapon-specific stats and actions
 * Uses BaseCard with WeaponContent renderer
 */
function WeaponCard({ characterItem, itemData, onAttack }) {
    const { character } = useCharacter()
    const { showD20Popup, showModifyItemPopup } = usePopup()
    const t = useI18n()
    const [showDescription, setShowDescription] = useState(false)

    if (!itemData) {
        console.error(`Weapon data not found for ID: ${characterItem.id}`)
        return null
    }

    // itemData is already modified by InventoryList, use it directly
    const weaponObj = itemData

    // Use weapon utilities
    const hasEnoughAmmo = () => checkHasEnoughAmmo(weaponObj, characterItem, character.items)

    const handleAttack = () => {
        if (!hasEnoughAmmo()) {
            console.log('Not enough ammo to attack')
            return
        }

        if (onAttack) {
            onAttack(characterItem, weaponObj)
        } else {
            // Open D20 popup for weapon attack, passing characterItem
            showD20Popup(weaponObj.TYPE, characterItem)
        }
    }

    const handleModify = () => {
        // Pass original itemData (not modified) to popup
        showModifyItemPopup(characterItem, itemData)
    }

    const toggleDescription = () => {
        setShowDescription(!showDescription)
    }

    const formatDescription = (description) => {
        if (!description) return ''
        return description.replace(/\\n/g, '\n')
    }

    // Check if item can be modified
    const isModifiable = canBeModified(itemData)

    // Custom controls with Info and Modify buttons
    const customControls = (
        <>
            <div className="row card-controls">
                <input
                    type="checkbox"
                    className="themed-svg button-card"
                    data-icon="attack"
                    checked={hasEnoughAmmo()}
                    disabled={!hasEnoughAmmo()}
                    onChange={handleAttack}
                />
                {isModifiable && (
                    <button
                        className="modify-button"
                        onClick={handleModify}
                    >
                        {t('modify') || 'Modify'}
                    </button>
                )}
                <button
                    className="description-toggle-button description-toggle-button--icon"
                    onClick={toggleDescription}
                    title={t('showDescription')}
                >
                    <i className="fas fa-info-circle"></i>
                </button>
            </div>

            {/* Description Overlay */}
            {showDescription && (
                <div className="card-description-overlay" onClick={toggleDescription}>
                    <div className="card-description-overlay__content" onClick={(e) => e.stopPropagation()}>
                        <div className="card-description-overlay__header">
                            <h3>{t(weaponObj.ID)}</h3>
                            <button
                                className="card-description-overlay__close"
                                onClick={toggleDescription}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="card-description-overlay__text">
                            <p>{formatDescription(t(`${weaponObj.ID}Description`))}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )

    return (
        <BaseCard
            characterItem={characterItem}
            itemData={weaponObj}
            contentRenderer={WeaponContent}
            onAction={handleAttack}
            actionIcon="attack"
            actionType="attack"
            isEquipped={hasEnoughAmmo()}
            disabled={!hasEnoughAmmo()}
            className="weapon-card"
            customControls={customControls}
        />
    )
}

export default WeaponCard
