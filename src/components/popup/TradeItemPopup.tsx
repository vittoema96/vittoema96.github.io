import { useMemo, useState } from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { useTooltip } from '@/contexts/TooltipContext';
import { useTranslation } from 'react-i18next';
import { CharacterItem, GenericPopupProps } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { addItem } from '@/utils/itemUtils.ts';
import Tag from '@/components/Tag.tsx';
import BasePopup from '@/components/popup/common/BasePopup.tsx';

interface TradeItemPopupProps extends GenericPopupProps {
    item?: CharacterItem
}

function TradeItemPopup({ onClose, item }: Readonly<TradeItemPopupProps>) {
    const { t } = useTranslation();
    const { character, updateCharacter } = useCharacter();
    const dataManager = getGameDatabase();
    useTooltip();

    const [selectedItemId, setSelectedItemId] = useState<string | undefined>(item?.id)
    const [quantity, setQuantity] = useState<number | undefined>(1)

    const availableItems = useMemo(() => {
        return Object.values(dataManager['aid'])
            .filter(i => i.CATEGORY !== 'drinks')
            .toSorted((a, b) => t(a.ID).localeCompare(t(b.ID)))
    }, [])

    const getAvailableTags = () => {
        if (!selectedItemId) {return []}
        const data = dataManager['aid'][selectedItemId]
        return [
            ...(data.EFFECTS || []).map(tag => [tag.includes(':') ? tag : `${tag}: ]`]),
        ]
            .map(tag => {
                const [effectType, effectOpt] = (tag as string).split(':');
                let displayValue = t(effectOpt!);
                if (displayValue) { displayValue = ` ${displayValue}`; }
                const displayText = `${t(effectType!)}${displayValue}`;
                return (
                    <Tag key={tag as string} tooltipId={`${effectType}Description`}>
                        {displayText}
                    </Tag>
                );
        })
    }


    const handleConfirm = () => {
        if (!selectedItemId || !quantity) {return}
        const data = dataManager['aid'][selectedItemId]

        const currItemIndex = character.items.findIndex(i => i.id === selectedItemId)

        const newItems = character.items.toSpliced(currItemIndex, 1)
        const addedItem: CharacterItem = {
            id: selectedItemId,
            quantity,
            equipped: false,
            mods: []
        }

        updateCharacter({ items: addItem(newItems, addedItem) })
    }

    return (
        <BasePopup
            title={'tradeItem'}
            onConfirm={handleConfirm}
            onClose={onClose}
            disabled={!selectedItemId || !quantity}>

            <div className="row l-lastSmall" style={{ alignItems: 'center' }}>
                <span className="h5" style={{ minWidth: '5rem' }}>{t('item')}:</span>
                <select
                    value={selectedItemId}
                    style={{ width: '100%' }}
                    onChange={(e) => {
                        const val = e.target.value
                        setSelectedItemId(val)

                        if (!val) { return }

                        const item = dataManager['aid'][val]
                        setQuantity(1)
                    }}
                >
                    <option value={undefined as any}>{''}</option>
                    {availableItems.map(i => <option key={i.ID} value={i.ID}>{t(i.ID)}</option>)}
                </select>
            </div>

            <div className="row">
                <span className="h5" style={{ minWidth: '5rem' }}>{t('quantity')}:</span>
                <input
                    type="number"
                    min="1"
                    value={quantity ?? ''}
                    onChange={(e) => {
                        const val = Number.parseInt(e.target.value)
                        setQuantity(val ? Math.max(1, val) : undefined)
                    }}
                    style={{ width: '5rem' }}
                />
            </div>

            <div className="row l-distributed l-wrapped" style={{ marginTop: '1rem' }}>
                {getAvailableTags()}
            </div>
        </BasePopup>
    )
}

export default TradeItemPopup

