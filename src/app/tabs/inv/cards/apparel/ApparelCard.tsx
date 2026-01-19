import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BaseCard from '../BaseCard.tsx'
import ApparelContent from '@/app/tabs/inv/cards/apparel/ApparelContent.tsx'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import {getGameDatabase, getModifiedItemData } from "@/hooks/getGameDatabase.ts"
import { canBeModified } from '@/utils/itemUtils.ts'
import { CharacterItem, Item } from '@/types';

/**
 * Apparel card component with armor stats and equip functionality
 * Uses BaseCard with ApparelContent renderer
 */
interface ApparelCardProps {
    characterItem: CharacterItem,
    onEquip?: (item: CharacterItem, data: Item) => void // TODO remove data from this
}
function ApparelCard({ characterItem, onEquip }: Readonly<ApparelCardProps>) {
    const { t } = useTranslation()
    const { showModifyItemPopup } = usePopup()
    const dataManager = getGameDatabase()
    const itemData = getModifiedItemData(characterItem)
    const [showDescription, setShowDescription] = useState(false)

    if (!dataManager.isType(itemData, 'apparel')) {
        console.error(`Apparel data not found for ID: ${characterItem.id}`)
        return null
    }

    // Check if this is a robot part (unacquirable)
    // TODO check in a better way
    const isRobotPart = dataManager.isUnacquirable(characterItem.id)

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

    const formatDescription = (description: string) => {
        if (!description) {return ''}
        return description.replaceAll(String.raw`\n`, '\n');
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
                            <h3>{t(itemData.ID)}</h3>
                            <button
                                className="card-description-overlay__close"
                                onClick={toggleDescription}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="card-description-overlay__text">
                            <p>{formatDescription(t(`${itemData.ID}Description`))}</p>
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
