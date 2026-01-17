import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BaseCard from '../BaseCard.tsx'
import WeaponContent from '@/app/tabs/inv/cards/weapon/WeaponContent.tsx'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import { canBeModified } from '@/utils/itemUtils.ts'
import { hasEnoughAmmo as checkHasEnoughAmmo } from '@/app/tabs/inv/utils/weaponUtils.ts'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { CharacterItem, Item } from '@/types';

/**
 * Weapon card component with weapon-specific stats and actions
 * Uses BaseCard with WeaponContent renderer
 */
interface WeaponCardProps {
    characterItem: CharacterItem,
    onAttack?: (item: CharacterItem, data: Item) => void // TODO remove data from this
}
function WeaponCard({ characterItem, onAttack }: Readonly<WeaponCardProps>) {
    const { t } = useTranslation();
    const { character } = useCharacter();
    const { showD20Popup, showModifyItemPopup } = usePopup();
    const [showDescription, setShowDescription] = useState(false);

    const dataManager = getGameDatabase();
    const itemData = getModifiedItemData(characterItem)
    if (!dataManager.isType(itemData, 'weapon')) {
        console.error(`Weapon data not found for ID: ${characterItem.id}`);
        return null;
    }

    // Use weapon utilities
    const hasEnoughAmmo = () => checkHasEnoughAmmo(itemData, character);

    const handleAttack = () => {
        if (!hasEnoughAmmo()) {
            console.log('Not enough ammo to attack');
            return;
        }

        if (onAttack) {
            onAttack(characterItem, itemData);
        } else {
            // Open D20 popup for weapon attack, passing characterItem
            showD20Popup(itemData.CATEGORY, characterItem);
        }
    };

    const handleModify = () => {
        // Pass original itemData (not modified) to popup
        showModifyItemPopup(characterItem, itemData);
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

    // Check if item can be modified
    const isModifiable = canBeModified(itemData);

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
                    <button className="modify-button" onClick={handleModify}>
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
                    <div
                        className="card-description-overlay__content"
                        onClick={e => e.stopPropagation()}
                    >
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
    );

    return (
        <BaseCard
            characterItem={characterItem}
            contentRenderer={WeaponContent}
            onAction={handleAttack}
            actionIcon="attack"
            actionType="attack"
            isEquipped={hasEnoughAmmo()}
            disabled={!hasEnoughAmmo()}
            className="weapon-card"
            customControls={customControls}
        />
    );
}

export default WeaponCard
