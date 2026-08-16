import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import { CharacterItem, GenericPopupProps } from '@/types';
import BasePopup from '@/app/components/popup/common/BasePopup.tsx';
import useInputNumberState from '@/hooks/useInputNumberState.ts';
import { ITEM_TYPE_MAP, ItemCategory, ItemType } from '@/types/item.ts';
import ItemBaseCard from '@/app/tabs/inv/cards/BaseCard.tsx';
import WeaponContent from '@/app/tabs/inv/cards/weapon/WeaponContent.tsx';
import ApparelContent from '@/app/tabs/inv/cards/apparel/ApparelContent.tsx';
import AidContent from '@/app/tabs/inv/cards/aid/AidContent.tsx';
import OtherContent from '@/app/tabs/inv/cards/ammo/OtherContent.tsx';
import { BaseItem } from '@/data/types.ts';
import { compiledData } from '@/data';
import { isType, isUnacquirable } from '@/features/item/utils.ts';
import { useItemManagement } from '@/app/contexts/useItemManagement.ts';

export interface AddItemPopupProps extends GenericPopupProps {
    itemType: ItemType;
}

type RarityOperator = '=' | '>=' | '<='

const BUY_MAX_QUANTITY = 99

function AddItemPopup({ onClose, itemType}: Readonly<AddItemPopupProps>) {
    const { t } = useTranslation()

    const [isFormValid, setIsFormValid] = useState(false)
    const [onConfirmCallback, setOnConfirmCallback] = useState<() => void>(() => {})
    const [onBuyCallback, setOnBuyCallback] = useState<(() => void) | null>(null)

    // Custom item mode
    const [isCustomMode, setIsCustomMode] = useState(false)

    useEffect(() => {
        if (isCustomMode) {
            setOnBuyCallback(null)
        }
    }, [isCustomMode])

    const footerChildren = (
        <>
            {!isCustomMode && (
                <button
                    type="button"
                    className="confirmButton"
                    disabled={!onBuyCallback}
                    onClick={() => {
                        onClose()
                        onBuyCallback?.()
                    }}
                >
                    {t('buy')}
                </button>
            )}

            {itemType === 'other' && (
                <button
                    type="button"
                    className="closeButton"
                    onClick={() => setIsCustomMode(!isCustomMode)}
                >
                    {t(isCustomMode ? 'backToList' : 'customItem')}
                </button>
            )}
        </>
    )

    return (
        <BasePopup
            title={isCustomMode ? 'customItem' : 'chooseItem'}
            onConfirm={() => {
                onConfirmCallback()
                onClose()
            }}
            onClose={onClose}
            confirmDisabled={!isFormValid}
            footerChildren={footerChildren}
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
                    setOnConfirmCallback={setOnConfirmCallback}
                    setOnBuyCallback={setOnBuyCallback}/>
            )}

        </BasePopup>
    )
}

export default AddItemPopup

function AddItemFromListContent({ itemType, setIsFormValid, setOnConfirmCallback, setOnBuyCallback }: Readonly<{
    itemType: ItemType,
    setIsFormValid: (valid: boolean) => void,
    setOnConfirmCallback: (callback: () => void) => void
    setOnBuyCallback: (callback: (() => void) | null) => void,
}>) {

    const { t } = useTranslation()
    const { addItem } = useItemManagement()
    const { showTradeItemPopup } = usePopup()

    const [selectedItem, setSelectedItem] = useState<BaseItem>()
    const [quantity, setQuantity] = useInputNumberState(1)
    const [categoryFilter, setCategoryFilter] = useState<ItemCategory>()
    const [rarityFilter, setRarityFilter] = useState<number>()
    const [rarityOperator, setRarityOperator] = useState<RarityOperator>('=')

    const availableItems = useMemo(() => {
        const allItems = Object.values(compiledData[itemType])
            .filter(item => {
                // Remove unacquirable
                if(isUnacquirable(item.ID)) { return false }
                // If rarity or category filters, filter out what doesn't adhere
                if(categoryFilter && item.CATEGORY !== categoryFilter) { return false }
                if(rarityFilter !== undefined) {
                    const itemRarity = Number(item.RARITY)
                    if (Number.isNaN(itemRarity)) { return false }
                    if(rarityOperator === '=' && itemRarity !== rarityFilter) { return false }
                    if(rarityOperator === '>=' && itemRarity < rarityFilter) { return false }
                    if(rarityOperator === '<=' && itemRarity > rarityFilter) { return false }
                }

                // Filter out mrHandyOnly and companionWeapons
                const isWeapon = isType(item, 'weapon')
                return !(isWeapon && (
                    item.QUALITIES.includes('qualityMrHandyOnly')
                    || item.ID.startsWith('weaponCompanion') // TODO better check for this
                ))
            })

        return allItems.toSorted((a, b) => t(a.ID).localeCompare(t(b.ID)))
    }, [itemType, categoryFilter, rarityFilter, rarityOperator, t])

    useEffect(() => {
        setSelectedItem(availableItems[0])
    }, [availableItems]);

    useEffect(() => {
        setCategoryFilter(undefined)
        setRarityFilter(undefined)
        setRarityOperator('=')
    }, [itemType])

    const toggleRarityOperator = useCallback(() => {
        setRarityOperator(current => {
            if (current === '=') { return '>=' }
            if (current === '>=') { return '<=' }
            return '='
        })
    }, [])

    useEffect(() => {
        setIsFormValid(Boolean(selectedItem && quantity))
    }, [quantity, selectedItem, setIsFormValid]);

    useEffect(() => {
        if (!selectedItem || quantity === '') {
            setOnBuyCallback(null)
            return
        }

        setOnBuyCallback(() => () => {
            showTradeItemPopup({
                characterItem: {
                    id: selectedItem.ID,
                    quantity,
                    equipped: false,
                    mods: [],
                },
                tradeMode: 'buy',
                initialQuantity: quantity,
                maxQuantity: BUY_MAX_QUANTITY,
            })
        })
    }, [quantity, selectedItem, setOnBuyCallback, showTradeItemPopup]);

    const handleConfirm = useCallback(() => {
        if(selectedItem && quantity){
            addItem({
                id: selectedItem.ID,
                quantity: quantity,
                equipped: false,
                mods: [],
            });
        }
    }, [selectedItem, quantity, addItem])

    // Registra la callback quando cambia
    useEffect(() => {
        setOnConfirmCallback(() => handleConfirm)
    }, [handleConfirm, setOnConfirmCallback])

    const getCategories = () => {

        const categories = ITEM_TYPE_MAP[itemType].filter((c: any) => c !== 'companionWeapon');

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

    const previewCharacterItem = useMemo<CharacterItem | undefined>(() => {
        if (!selectedItem || quantity === '') {
            return undefined
        }

        return {
            id: selectedItem.ID,
            quantity,
            equipped: false,
            mods: [],
        }
    }, [quantity, selectedItem])

    const previewContentRenderer = useMemo(() => {
        if (!selectedItem) {
            return null
        }

        if (isType(selectedItem, 'weapon')) {
            return WeaponContent
        }
        if (isType(selectedItem, 'apparel')) {
            return ApparelContent
        }
        if (isType(selectedItem, 'aid')) {
            return AidContent
        }
        return OtherContent
    }, [selectedItem])

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
                <label style={{ marginRight: '0.5rem' }}>{t('rarity')}</label>
                <button
                    type="button"
                    onClick={toggleRarityOperator}
                    aria-label="Rarity comparison operator"
                    style={{ marginRight: '0.5rem', minWidth: '2.5rem' }}
                >
                    {rarityOperator}
                </button>
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
                        const item = availableItems.find(i => i.ID === e.target.value)
                        setSelectedItem(item)
                    }}
                    aria-label="Object picker"
                    style={{ flex: 1, minWidth: 0 }}
                >
                    {availableItems.map(item => {
                        return (
                            <option key={item.ID} value={item.ID}>
                                {t(item.ID)}
                            </option>
                        )
                    })}
                </select>

                <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                        setQuantity(e.target.value)
                    }}
                    aria-label="Object quantity"
                    style={{ width: '5rem' }}
                />
            </div>

            {previewCharacterItem && previewContentRenderer && (
                <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                    <ItemBaseCard
                        characterItem={previewCharacterItem}
                        action={undefined}
                        contentRenderer={previewContentRenderer}
                        className="preview-card"
                    />
                </div>
            )}
        </>)
}

function AddCustomItemContent({ itemType, setIsFormValid, setOnConfirmCallback }: Readonly<{
    itemType: ItemType,
    setIsFormValid: (valid: boolean) => void,
    setOnConfirmCallback: (callback: () => void) => void
}>) {
    const { t } = useTranslation()
    const { addItem } = useItemManagement()

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
        addItem({
            customName: customName.trim(),
            quantity: Math.max(1, customQuantity || 1),

            COST: Math.max(0, customValue || 0),
            WEIGHT: Math.max(0, Number.parseFloat(customWeight) || 0),
            RARITY: Math.max(0, customRarity || 0),
            TYPE: itemType,
            CATEGORY: 'custom',

            description: customDescription.trim() || undefined
        })
    }, [addItem, customDescription, customName, customQuantity, customRarity, customValue, customWeight, itemType])

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
                        min={0}
                        step={0.5}
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
                        min={0}
                        step={1}
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
