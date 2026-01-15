import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BaseCard from './BaseCard.tsx'
import ApparelContent from './content/ApparelContent.tsx'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import {useGameDatabase} from "@/hooks/useGameDatabase"
import { canBeModified } from '@/utils/itemUtils.ts'

/**
 * Apparel card component with armor stats and equip functionality
 * Uses BaseCard with ApparelContent renderer
 */
function ApparelCard({ characterItem, itemData, onEquip }) {
    const { t } = useTranslation()
    const { showModifyItemPopup } = usePopup()
    const dataManager = useGameDatabase()
    const [showDescription, setShowDescription] = useState(false)

    if (!itemData) {
        console.error(`Apparel data not found for ID: ${characterItem.id}`)
        return null
    }

    // itemData is already modified by InventoryList, use it directly
    const apparelObj = itemData

    const [itemId] = characterItem.id.split('_')

    // Check if this is a robot part (unacquirable)
    const isRobotPart = dataManager.isUnacquirable(itemId)

    const handleEquip = () => {
        // Robot parts cannot be unequipped
        if (isRobotPart) {return}

        if (onEquip) {
            onEquip(characterItem, itemData)
        } else {
            // TODO: Implement equip functionality
            console.log('Equip apparel:', characterItem.id)
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
        if (!description) {return ''}
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
                    data-icon="armor"
                    checked={isRobotPart ? true : characterItem.equipped === true}
                    disabled={isRobotPart}
                    onChange={handleEquip}
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
                            <h3>{t(apparelObj.ID)}</h3>
                            <button
                                className="card-description-overlay__close"
                                onClick={toggleDescription}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="card-description-overlay__text">
                            <p>{formatDescription(t(`${apparelObj.ID}Description`))}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )

    return (
        <BaseCard
            characterItem={characterItem}
            contentRenderer={ApparelContent}
            onAction={handleEquip}
            actionIcon="armor"
            actionType="equip"
            isEquipped={characterItem.equipped === true}
            className="apparel-card"
            customControls={customControls}
        />
    )
}

export default ApparelCard
