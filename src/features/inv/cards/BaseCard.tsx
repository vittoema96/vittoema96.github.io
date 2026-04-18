import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { CharacterItem, CustomItem } from '@/types';
import { FitText } from '@/components/FitText.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';

/**
 * Base card component - provides common card structure and functionality
 * Content is rendered via contentRenderer prop for maximum flexibility
 * Supports both database items (CharacterItem) and custom items (CustomItem)
 */

interface ActionDefinition {
    icon: string,
    onClick: (item: CharacterItem | CustomItem) => void,
    isChecked?: (item: CharacterItem | CustomItem) => boolean,
    isDisabled?: (item: CharacterItem | CustomItem) => boolean,
}

interface BaseCardProps {
    characterItem: CharacterItem | CustomItem,
    action: ActionDefinition | undefined,

    className?: string,

    contentRenderer: React.ComponentType<any>,
}

function BaseCard({
    characterItem,
    action,
    contentRenderer: ContentRenderer,
    className = '',
}: Readonly<BaseCardProps>) {
    const {
        icon: buttonIcon,
        onClick: onButtonClick = () => {},
        isChecked: isButtonChecked = () => true,
        isDisabled: isButtonDisabled = () => false,
    } = action || {};
    const { t } = useTranslation();
    const [showDescription, setShowDescription] = useState(false);
    const { showModifyItemPopup } = usePopup()

    const item = {
        variation: undefined,
        ...characterItem
    }

    const dataManager = getGameDatabase();
    let itemData
    let isModdable = false
    if("id" in item){
        itemData = getModifiedItemData(item) ?? dataManager.getItem(item.id);
        isModdable = (dataManager.isType(itemData, "weapon")
            || dataManager.isType(itemData, "apparel"))
    } else {
        itemData = item
    }

    if (!itemData) {
        return null;
    }

    const quantity = item.quantity;

    const handleAction = () => {
        if(!isButtonDisabled(item)) {
            onButtonClick(item);
        }
    };

    const toggleDescription = () => {
        setShowDescription(!showDescription);
    };

    const formatDescription = (description: string) => {
        if (!description) {
            return '';
        }
        return description.replaceAll(String.raw`\n`, '\n');
    };

    return (
        <div className={`card card--compact ${className}`}>
            {/* Card Header - Single Line */}
            <div className="card-header card-header--compact">
                <div className="card-header__title">
                    {quantity > 1 && <span className="card-quantity">{quantity}x</span>}
                    <FitText wrap={true} minSize={10} maxSize={14}>
                        {item.customName || t(itemData.ID ?? '', {
                            variation: t(item.variation!)
                        })}
                    </FitText>
                </div>
                <div className="card-header__stats">
                    <div className="card-stat-icon" title={t('cost')}>
                        <i className="fas fa-coins"></i>
                        <span>{itemData.COST}</span>
                    </div>
                    <div className="card-stat-icon" title={t('weight')}>
                        <i className="fas fa-weight-hanging"></i>
                        <span>{itemData.WEIGHT}</span>
                    </div>
                    <div className="card-stat-icon" title={t('rarity')}>
                        <i className="fas fa-star"></i>
                        <span>{itemData.RARITY}</span>
                    </div>
                </div>
            </div>

            {/* Card Content - rendered by content renderer */}
            <div className="card-content card-content--compact">
                {ContentRenderer && (
                    <ContentRenderer
                        characterItem={item}
                        actionButtons={action ? (
                            <div className="card-content__buttons">
                                <button
                                    className={`card-action-btn card-action-btn--primary card-action-btn--large ${!isButtonChecked(item) ? 'disabled' : ''}`}
                                    onClick={handleAction}
                                    disabled={isButtonDisabled(item)}
                                    title={buttonIcon}
                                >
                                    <div className="themed-svg" data-icon={buttonIcon}></div>
                                </button>
                                <div className="card-content__buttons-row">
                                    <button
                                        className="card-action-btn card-action-btn--info card-action-btn--small"
                                        onClick={toggleDescription}
                                        title={t('showDescription')}
                                    >
                                        <i className="fas fa-info-circle"></i>
                                    </button>
                                    {isModdable && (
                                        <button
                                            className="card-action-btn card-action-btn--modify card-action-btn--small"
                                            onClick={() => showModifyItemPopup({ characterItem: item as CharacterItem })}
                                            title={t('modify')}
                                        >
                                            <i className="fas fa-wrench"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : undefined}
                    />
                )}
            </div>

            {/* Description Overlay - shown when toggled */}
            {showDescription && (
                <div className="card-description-overlay" onClick={toggleDescription}>
                    <div
                        className="card-description-overlay__content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="card-description-overlay__header">
                            <h3>{t(itemData.ID ?? '', {variation: t(item.variation!)})}</h3>
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
        </div>
    );
}

export default BaseCard
