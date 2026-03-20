import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/contexts/CharacterContext';
import { getGameDatabase } from '@/hooks/getGameDatabase';
import { GenericItem, GenericPopupProps, ItemCategory, ItemType, Side } from '@/types';
import { addItem } from '@/utils/itemUtils.ts';
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import useInputNumberState from '@/hooks/useInputNumberState.ts';

export interface AddItemPopupProps extends GenericPopupProps {
    itemType: ItemType;
}

type SelectableItem = GenericItem & { variation?: Side }

function AddItemPopup({ onClose, itemType}: Readonly<AddItemPopupProps>) {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const dataManager = getGameDatabase()

    const [selectedItem, setSelectedItem] = useState<SelectableItem>()
    const [quantity, setQuantity] = useInputNumberState(1)
    const [categoryFilter, setCategoryFilter] = useState<ItemCategory>()
    const [rarityFilter, setRarityFilter] = useState<number>()
    const [shouldBuy, setShouldBuy] = useState(false)

    const availableItems = useMemo(() => {
        let allItems = Object.values(dataManager[itemType])
            .filter(item =>
                !(dataManager.isType(item, 'weapon') && (item.QUALITIES || []).includes('qualityMrHandyOnly'))
            )
            .filter(item => !(dataManager.isType(item, 'weapon') && (item as any).CATEGORY === 'companionWeapon'))

        if(categoryFilter) {
            allItems = allItems.filter(item => item.CATEGORY === categoryFilter)
        }

        allItems = allItems.filter(item => !dataManager.isUnacquirable(item.ID))

        if (rarityFilter !== undefined) {
            allItems = allItems.filter(item => item.RARITY === rarityFilter)
        }

        const itemsWithVariants: SelectableItem[] = []
        allItems.forEach(item => {
            let variants: (Side|undefined)[] = [undefined]
            if(dataManager.isType(item, "apparel") &&
                (item.LOCATIONS_COVERED.includes("arm")
                    || item.LOCATIONS_COVERED.includes("leg"))) {
                variants = ['left', 'right']
            }

            variants.forEach(variation => {
                itemsWithVariants.push({
                    ...item,
                    ...(variation ? {variation} : {})
                })
            })
        })

        return itemsWithVariants.toSorted((a, b) => {

            const getName = (item: SelectableItem) => {
                if(!item) {return ''}
                return t(item.ID, { variation: t(item.variation!) });
            }
            const nameA = getName(a)
            const nameB = getName(b)

            return nameA.localeCompare(nameB)
        })
    }, [itemType, categoryFilter, rarityFilter, t])
    useEffect(() => {
        setSelectedItem(availableItems[0])
    }, [availableItems]);

    const getCategories = () => {
        const typeMap = dataManager.getItemTypeMap()
        const categories = typeMap[itemType].filter((c: any) => c !== 'companionWeapon')

        return categories.toSorted((a, b) => {
            if(!a && !b) {return 0}
            if(!a) {return 1}
            if(!b) {return -1}
            return t(a).localeCompare(t(b))
        }).map(categoryFilter => {
            return <option key={categoryFilter} value={categoryFilter}>
                        {t(categoryFilter || 'all')}
                   </option>
        })
    }

    useEffect(() => {
        setCategoryFilter(undefined)
        setRarityFilter(undefined)
    }, [itemType])

    const handleConfirm = () => {
        if (!selectedItem || !quantity) {return}

        let totalCost = 0
        if (shouldBuy) {
            totalCost = selectedItem.COST * quantity

            if (character.caps < totalCost) {
                return
            }
        }

        const newItems = addItem(character.items, {
            id: selectedItem.ID,
            quantity: quantity,
            equipped: false,
            mods: [],
            ...(selectedItem.variation ? { variation: selectedItem.variation} : {})
        })
        updateCharacter({
            items: newItems,
            ...(shouldBuy ? {caps: character.caps - totalCost} : {})
        })
    }

    return (
        <BasePopup
            title={'chooseItem'}
            onConfirm={handleConfirm}
            onClose={onClose}
            disabled={!selectedItem || !quantity}>
            <hr />

            {/* Category Filter */}
            <div className="row" style={{ marginBottom: '1rem', alignItems: 'center' }}>
                <label style={{ marginRight: '0.5rem' }}>{t('type')}:</label>
                <select
                    value={categoryFilter ?? 'all'}
                    onChange={(e) => {
                        const value = e.target.value
                        const filter = value === 'all' ? undefined : value as ItemCategory
                        setCategoryFilter(filter)
                    }}
                    aria-label="Type filter"
                    style={{ flex: 1, minWidth: 0 }}
                >
                    <option value={'all'}>{t('all')}</option>
                    {getCategories()}
                </select>
            </div>

            {/* Rarity Filter */}
            <div className="row" style={{ marginBottom: '1rem', alignItems: 'center' }}>
                <label style={{ marginRight: '0.5rem' }}>{t('rarity')}:</label>
                <select
                    value={rarityFilter ?? 'all'}
                    onChange={(e) => {
                        const value = e.target.value
                        const filter = value === 'all' ? undefined : Number.parseInt(value)
                        setRarityFilter(filter)
                    }}
                    aria-label="Rarity filter"
                    style={{ flex: 1, minWidth: 0 }}
                >
                    <option value={'all'}>{t('all')}</option>
                    <option value={0}>{t('rarity0')}</option>
                    <option value={1}>{t('rarity1')}</option>
                    <option value={2}>{t('rarity2')}</option>
                    <option value={3}>{t('rarity3')}</option>
                    <option value={4}>{t('rarity4')}</option>
                    <option value={5}>{t('rarity5')}</option>
                    <option value={6}>{t('rarity6')}</option>
                </select>
            </div>

            <div className="row" style={{ alignItems: 'center' }}>
                <select
                    onChange={(e) => {
                        const item = availableItems.find(i => {
                            const id = `${i.ID}_${i?.variation ?? ''}`
                            return id === e.target.value
                        })
                        setSelectedItem(item)
                    }}
                    aria-label="Object picker"
                    style={{ flex: 1, minWidth: 0 }}
                >
                    {availableItems.map(item => {
                        const id = `${item.ID}_${item?.variation ?? ''}`
                        return (
                            <option key={id} value={id}>
                                {t(item.ID, { variation: t(item.variation!) })}
                            </option>
                        )
                    })}
                </select>

                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                        setQuantity(e.target.value)
                    }}
                    aria-label="Object quantity"
                    style={{ width: '5rem' }}
                />
            </div>

            {/* Buy checkbox and price */}
            <div className="row" style={{ marginTop: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t('buy')}?
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        className="themed-svg"
                        data-icon="caps"
                        checked={shouldBuy}
                        onChange={(e) => setShouldBuy(e.target.checked)}
                        style={{
                            width: '1.2rem',
                            height: '1.2rem'
                        }}
                    />
                    <span style={{
                        color: shouldBuy ? 'var(--primary-color)' : 'var(--primary-color-very-translucent)',
                    }}>
                        {(selectedItem ? selectedItem.COST : 0) * Number(quantity)}
                    </span>
                </label>
            </div>

            <hr />

        </BasePopup>
    )
}

export default AddItemPopup

