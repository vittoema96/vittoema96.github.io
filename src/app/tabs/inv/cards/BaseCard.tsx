import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { CharacterItem, Item } from '@/types';
import { FitText } from '@/app/FitText.tsx';

/**
 * Base card component - provides common card structure and functionality
 * Content is rendered via contentRenderer prop for maximum flexibility
 */
interface BaseCardProps {
    characterItem: CharacterItem,
    contentRenderer: React.ComponentType<any>,
    onAction?: (item: CharacterItem, data: Item) => void,
    actionIcon?: string,
    actionType?: string,
    isEquipped?: boolean,
    disabled?: boolean,
    hideControls?: boolean,
    customControls?: React.ReactNode,
    className?: string
}

function BaseCard({
    characterItem,
    contentRenderer: ContentRenderer,
    onAction,
    actionIcon = 'attack',
    isEquipped = false,
    disabled = false,
    hideControls = false,
    customControls = null,
    className = '',
}: Readonly<BaseCardProps>) {
    const { t } = useTranslation();
    const [showDescription, setShowDescription] = useState(false);
    const dataManager = getGameDatabase();
    let itemData = dataManager.getItem(characterItem.id);
    if(dataManager.isType(itemData, "moddable")){
        itemData = getModifiedItemData(characterItem);
    }

    if (!itemData) {
        console.error(`Item data not found for ID: ${characterItem.id}`);
        return null;
    }

    const quantity = characterItem.quantity;

    const handleAction = () => {
        if (disabled) {
            return;
        }

        if (onAction) {
            onAction(characterItem, itemData);
        }
    };

    const toggleDescription = () => {
        setShowDescription(!showDescription);
    };

    const formatDescription = (description: string) => {
        if (!description) {
            return '';
        }
        return description.replace(/\\n/g, '\n');
    };

    return (
        <section className={`card ${className}`}>
            {/* Card Header */}
            <div className="row card-header l-lastSmall">
                <div className="row" style={{ minWidth: 0 }}>
                    <span className="card-quantity">
                        <i>{quantity}x</i>
                    </span>
                    <FitText wrap={true} minSize={13} maxSize={23}>
                        {t(itemData.ID, {
                            variation: t(characterItem.variation!)
                        })}
                    </FitText>
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
                    // TODO Check that all ContentRenderer DO NOT use side (but use characterItem.variation instead)
                    <ContentRenderer characterItem={characterItem}/>
                )}
            </div>

            {/* Card Controls */}
            {customControls ||
                (hideControls ? null : (
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
                ))}

            {/* Description Overlay - shown when toggled */}
            {showDescription && (
                <div className="card-description-overlay" onClick={toggleDescription}>
                    <div
                        className="card-description-overlay__content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="card-description-overlay__header">
                            {/* TODO currently no translation uses parameters, but...*/}
                            <h3>{t(itemData.ID, {variation: t(characterItem.variation!)})}</h3>
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
    );
}

export default BaseCard
