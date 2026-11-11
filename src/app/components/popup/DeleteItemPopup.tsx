import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BasePopup from '@/app/components/popup/common/BasePopup.tsx';
import { CharacterItem, CustomItem, GenericPopupProps } from '@/types';
import useInputNumberState from '@/hooks/useInputNumberState.ts';
import { useItemManagement } from '@/app/contexts/useItemManagement.ts';
import { usePopup } from '@/app/contexts/PopupContext.tsx';

export interface DeleteItemPopupProps extends GenericPopupProps {
    characterItem: CharacterItem | CustomItem;
}

function DeleteItemPopup({ onClose, characterItem }: Readonly<DeleteItemPopupProps>) {
    const { t } = useTranslation();
    const { removeItem } = useItemManagement();
    const { showAlert } = usePopup();
    const [quantity, setQuantity] = useInputNumberState(characterItem.quantity);
    const [hasInvalidQuantity, setHasInvalidQuantity] = useState(false);

    const itemName = characterItem.customName ?? ('id' in characterItem ? t(characterItem.id) : '');
    const isQuantityValid = quantity !== '' && quantity >= 1 && quantity <= characterItem.quantity;

    const handleQuantityChange = (value: string) => {
        const parsed = Number.parseInt(value, 10);
        if (value === '' || Number.isNaN(parsed)) {
            setQuantity('');
            setHasInvalidQuantity(true);
        } else if (parsed >= 1 && parsed <= characterItem.quantity) {
            setQuantity(parsed);
            setHasInvalidQuantity(false);
        }
    };

    const handleConfirm = () => {
        if (quantity === '' || quantity < 1 || quantity > characterItem.quantity) {
            setHasInvalidQuantity(true);
            return;
        }
        removeItem({ ...characterItem, quantity });
        showAlert(t('itemDeleted'));
        onClose();
    };

    return (
        <BasePopup
            title="delete"
            onConfirm={handleConfirm}
            onClose={onClose}
            confirmDisabled={!isQuantityValid}
        >
            <hr />
            <p>{t('confirmDeleteItem', { quantity, itemName })}</p>
            <div className="row l-distributed">
                <label htmlFor="delete-quantity">{t('quantity')}</label>
                <input
                    id="delete-quantity"
                    type="number"
                    min="1"
                    max={characterItem.quantity}
                    value={quantity}
                    onChange={event => handleQuantityChange(event.target.value)}
                    aria-invalid={hasInvalidQuantity}
                    aria-label={t('quantity')}
                    style={{ width: '5rem' }}
                />
            </div>
        </BasePopup>
    );
}

export default DeleteItemPopup;
