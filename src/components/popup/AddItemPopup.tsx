import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/contexts/CharacterContext';
import { getGameDatabase } from '@/hooks/getGameDatabase';
import { CustomItem, GenericItem, GenericPopupProps, ItemCategory, ItemType, Side } from '@/types';
import { addItem } from '@/utils/itemUtils.ts';
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import useInputNumberState from '@/hooks/useInputNumberState.ts';

export interface AddItemPopupProps extends GenericPopupProps {
    itemType: ItemType;
}

type SelectableItem = GenericItem & { variation?: Side }

function AddItemPopup({ onClose, itemType}: Readonly<AddItemPopupProps>) {
    const { t } = useTranslation()

    const [isFormValid, setIsFormValid] = useState(false)
    const [onConfirmCallback, setOnConfirmCallback] = useState<() => void>(() => {})

    // Custom item mode
    const [isCustomMode, setIsCustomMode] = useState(false)


    return (
        <BasePopup
            title={isCustomMode ? 'customItem' : 'chooseItem'}
            onConfirm={() => {
                onConfirmCallback()
                onClose()
            }}
            onClose={onClose}
            confirmDisabled={!isFormValid}
            footerChildren={itemType === 'other' ? (
                <button
                    type="button"
                    className="closeButton"
                    onClick={() => setIsCustomMode(!isCustomMode)}
                >
                    {t(isCustomMode ? 'backToList' : 'customItem')}
                </button>
            ) : undefined}
        >
            <hr />

            {isCustomMode ? (
                <AddCustomItemContent
                    itemType={itemType}
                    setIsFormValid={setIsFormValid}
                    setOnConfirmCallback={setOnConfirmCallback}/>
            ) : (
                <AddItemFromListContent
                    itemType={itemType}
                    setIsFormValid={setIsFormValid}
                    setOnConfirmCallback={setOnConfirmCallback}/>
            )}

        </BasePopup>
    )
}

export default AddItemPopup

function AddItemFromListContent({ itemType, setIsFormValid, setOnConfirmCallback }: Readonly<{
    itemType: ItemType,
    setIsFormValid: (valid: boolean) => void,
    setOnConfirmCallback: (callback: () => void) => void
}>) {

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
                !(dataManager.isType(item, 'weapon') && item.QUALITIES.includes('qualityMrHandyOnly'))
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

    useEffect(() => {
        setCategoryFilter(undefined)
        setRarityFilter(undefined)
    }, [itemType])

    useEffect(() => {
        setIsFormValid(Boolean(selectedItem && quantity))
    }, [quantity, selectedItem, setIsFormValid]);

    const handleConfirm = useCallback(() => {
        if(selectedItem && quantity){
            let totalCost = 0;
            if (shouldBuy) {
                totalCost = selectedItem.COST * quantity;

                if (character.caps < totalCost) {
                    return;
                }
            }

            const newItems = addItem(character.items, {
                id: selectedItem.ID,
                quantity: quantity,
                equipped: false,
                mods: [],
                ...(selectedItem.variation ? { variation: selectedItem.variation } : {}),
            });
            updateCharacter({
                items: newItems,
                ...(shouldBuy ? { caps: character.caps - totalCost } : {}),
            });
        }
    }, [character.caps, character.items, quantity, selectedItem, shouldBuy, updateCharacter])

    // Registra la callback quando cambia
    useEffect(() => {
        setOnConfirmCallback(() => handleConfirm)
    }, [handleConfirm, setOnConfirmCallback])

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

    return (<>
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
        </>)
}

function AddCustomItemContent({ itemType, setIsFormValid, setOnConfirmCallback }: Readonly<{
    itemType: ItemType,
    setIsFormValid: (valid: boolean) => void,
    setOnConfirmCallback: (callback: () => void) => void
}>) {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()

    // Custom item mode
    const [customName, setCustomName] = useState('')
    const [customQuantity, setCustomQuantity] = useInputNumberState(1)
    const [customWeight, setCustomWeight] = useState('0')
    const [customValue, setCustomValue] = useInputNumberState(0)
    const [customRarity, setCustomRarity] = useInputNumberState(0)
    const [customDescription, setCustomDescription] = useState('')

    useEffect(() => {
        setIsFormValid(customName.trim().length > 0)
    }, [customName, setIsFormValid]);


    const handleConfirm = useCallback(() => {
        // Create custom item (separate from database items)
        const newCustomItem: CustomItem = {
            customName: customName.trim(),
            quantity: Math.max(1, customQuantity || 1),

            COST: Math.max(0, customValue || 0),
            WEIGHT: Math.max(0, Number.parseFloat(customWeight) || 0),
            RARITY: Math.max(0, customRarity || 0),
            TYPE: itemType,
            CATEGORY: 'custom',

            description: customDescription.trim() || undefined
        }

        // Add to character's custom items array
        const updatedCustomItems = [
            ...(character.customItems),
            newCustomItem
        ]

        updateCharacter({
            customItems: updatedCustomItems
        })
    }, [character.customItems, customDescription, customName, customQuantity, customRarity, customValue, customWeight, itemType, updateCharacter])

    // Registra la callback quando cambia
    useEffect(() => {
        setOnConfirmCallback(() => handleConfirm)
    }, [handleConfirm, setOnConfirmCallback])

    return (
        <>
            {/* Weight, Value, Rarity - Single Row */}
            <div className="row" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fas fa-weight-hanging" title={t('weight')}></i>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={customWeight}
                        onChange={(e) => {
                            const value = Number.parseFloat(e.target.value)
                            if (!Number.isNaN(value)) {
                                setCustomWeight(`${Math.round(value * 2) / 2}`)
                            }
                        }}
                        onBlur={(e) => {
                            if (Number.isNaN(Number.parseFloat(e.target.value))) {
                                setCustomWeight('0')
                            }
                        }}
                        style={{ width: '2.5rem', fontSize: '0.8rem' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fas fa-coins" title={t('value')}></i>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        onBlur={(e) => {
                            if (Number.isNaN(Number.parseInt(e.target.value))) {
                                setCustomValue(0)
                            }
                        }}
                        style={{ width: '2.5rem', fontSize: '0.8rem' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fas fa-star" title={t('rarity')}></i>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        max="6"
                        value={customRarity}
                        onChange={(e) => setCustomRarity(e.target.value)}
                        onBlur={(e) => {
                            if (Number.isNaN(Number.parseInt(e.target.value))) {
                                setCustomRarity(0)
                            }
                        }}
                        style={{ width: '2.5rem', fontSize: '0.8rem' }}
                    />
                </div>
            </div>

            {/* Name and Quantity - Single Row */}
            <div className="row">
                <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={t('name')}
                    style={{ flex: 1, minWidth: 0 }}
                    maxLength={50}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span title={t('quantity')}>x</span>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        onBlur={(e) => {
                            if (Number.isNaN(Number.parseInt(e.target.value))) {
                                setCustomQuantity(0)
                            }
                        }}
                        style={{ width: '2.5rem', fontSize: '0.8rem' }}
                    />
                </div>
            </div>
            {/* Description */}
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                    {t('description')}:
                </label>
                <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder={t('descriptionOptional')}
                    style={{
                        width: '100%',
                        minHeight: '4rem',
                        resize: 'vertical',
                        padding: '0.5rem'
                    }}
                    maxLength={500}
                />
            </div>
        </>
    )
}
