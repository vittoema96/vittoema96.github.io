import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { CharacterItem } from '@/types';
import { FitText } from '@/components/FitText.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';

/**
 * Base card component - provides common card structure and functionality
 * Content is rendered via contentRenderer prop for maximum flexibility
 */

interface ActionDefinition {
    icon: string,
    onClick: (item: CharacterItem) => void,
    isChecked?: (item: CharacterItem) => boolean,
    isDisabled?: (item: CharacterItem) => boolean,
}

interface BaseCardProps {
    characterItem: CharacterItem,
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
    const dataManager = getGameDatabase();
    let itemData = dataManager.getItem(characterItem.id);
    const isModdable = dataManager.isType(itemData, "moddable") && itemData.AVAILABLE_MODS.length > 0;
    if(isModdable){
        itemData = getModifiedItemData(characterItem);
    }

    if (!itemData) {
        console.error(`Item data not found for ID: ${characterItem.id}`);
        return null;
    }

    const quantity = characterItem.quantity;

    const handleAction = () => {
        if(!isButtonDisabled(characterItem)) {
            onButtonClick(characterItem);
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
                        {t(itemData.ID, {
                            variation: t(characterItem.variation!)
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
                        characterItem={characterItem}
                        actionButtons={action ? (
                            <div className="card-content__buttons">
                                <button
                                    className={`card-action-btn card-action-btn--primary card-action-btn--large ${!isButtonChecked(characterItem) ? 'disabled' : ''}`}
                                    onClick={handleAction}
                                    disabled={isButtonDisabled(characterItem)}
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
                                            onClick={() => showModifyItemPopup(characterItem)}
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
        </div>
    );
}

export default BaseCard
