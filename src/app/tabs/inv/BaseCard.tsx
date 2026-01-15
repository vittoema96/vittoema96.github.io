import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {getGameDatabase} from "@/hooks/getGameDatabase.ts";

/**
 * Base card component - provides common card structure and functionality
 * Content is rendered via contentRenderer prop for maximum flexibility
 */
function BaseCard({
    characterItem,
    contentRenderer: ContentRenderer,
    onAction,
    actionIcon = 'attack',
    isEquipped = false,
    disabled = false,
    hideControls = false,
    customControls = null,
    className = ''
}) {
    const { t } = useTranslation()
    const [showDescription, setShowDescription] = useState(false)
    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)

    if (!itemData) {
        console.error(`Item data not found for ID: ${characterItem.id}`)
        return null
    }

    const quantity = characterItem.quantity

    const handleAction = () => {
        if (disabled) {return}

        if (onAction) {
            onAction(characterItem, itemData)
        }
    }

    const toggleDescription = () => {
        setShowDescription(!showDescription)
    }

    const formatDescription = (description) => {
        if (!description) {return ''}
        return description.replace(/\\n/g, '\n')
    }

    const variantParameters = characterItem.variant ? {
        variant: characterItem.variant
    } : {}

    return (
        <section
            className={`card ${className}`}
        >
            {/* Card Header */}
            <div className="row card-header l-lastSmall">
                <div className="row">
                    <span className="card-quantity">
                        <i>{quantity}x</i>
                    </span>
                    <span className="card-name">
                        {/* TODO currently no translation uses parameters, but...*/}
                        {t(itemData.ID, variantParameters)}
                    </span>
                </div>
                <div className="row">
                    <div className="card__header-stats">
                        <span>{t('cost')}</span>
                        <span>{itemData.COST}</span>
                    </div>
                    <div className="card__header-stats">
                        <span>{t('weight')}</span>
                        <span>{itemData.WEIGHT}</span>
                    </div>
                    <div className="card__header-stats">
                        <span>{t('rarity')}</span>
                        <span>{itemData.RARITY}</span>
                    </div>
                </div>
            </div>

            {/* Card Content - rendered by content renderer */}
            <div className="card-content">
                {ContentRenderer && (
                    <ContentRenderer
                        characterItem={characterItem}
                        side={characterItem.variant}
                    />
                )}
            </div>

            {/* Card Controls */}
            {customControls ? (
                customControls
            ) : !hideControls ? (
                <div className="row card-controls">
                    <input
                        type="checkbox"
                        className={`themed-svg button-card`}
                        data-icon={actionIcon}
                        checked={isEquipped}
                        disabled={disabled}
                        onChange={handleAction}
                    />
                    <button
                        className="description-toggle-button description-toggle-button--icon"
                        onClick={toggleDescription}
                        title={t('showDescription')}
                    >
                        <i className="fas fa-info-circle"></i>
                    </button>
                </div>
            ) : null}

            {/* Description Overlay - shown when toggled */}
            {showDescription && (
                <div className="card-description-overlay" onClick={toggleDescription}>
                    <div className="card-description-overlay__content" onClick={(e) => e.stopPropagation()}>
                        <div className="card-description-overlay__header">
                            {/* TODO currently no translation uses parameters, but...*/}
                            <h3>{t(itemData.ID, variantParameters)}</h3>
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
        </section>
    )
}

export default BaseCard
