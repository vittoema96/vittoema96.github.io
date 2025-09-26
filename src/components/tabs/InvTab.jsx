import React, { useState, useEffect } from 'react'
import { BODY_PARTS, SKILLS } from '../../js/constants.js'
import { useI18n } from '../../hooks/useI18n.js'
import { useDataManager } from '../../hooks/useDataManager.js'
import { usePopup } from '../../contexts/PopupContext.jsx'
import WeaponCard from '../inventory/WeaponCard.jsx'
import ApparelCard from '../inventory/ApparelCard.jsx'
import AidCard from '../inventory/AidCard.jsx'
import AmmoCard from '../inventory/AmmoCard.jsx'

function InvTab({ character, updateCharacter }) {
    const [activeSubTab, setActiveSubTab] = useState('weapon')
    const [damageReduction, setDamageReduction] = useState({})
    const t = useI18n()
    const dataManager = useDataManager()
    const { showAddItemPopup } = usePopup()

    // Update damage reduction when character changes
    useEffect(() => {
        updateDamageReduction()
    }, [character])



    const updateDamageReduction = () => {
        if (!character.getLocationsDR) {
            // Calculate damage reduction from equipped apparel
            const dr = {}
            Object.values(BODY_PARTS).forEach(bodyPart => {
                dr[bodyPart] = { physical: 0, energy: 0, radiation: 0 }
            })

            // Find equipped apparel items and calculate DR
            const equippedItems = character.items?.filter(item => item.equipped) || []
            equippedItems.forEach(item => {
                const [itemId] = item.id.split('_')
                const itemData = dataManager.getItem ? dataManager.getItem(itemId) : null

                if (itemData && itemData.LOCATIONS_COVERED) {
                    itemData.LOCATIONS_COVERED.forEach(location => {
                        if (dr[location]) {
                            dr[location].physical += itemData.PHYSICAL_DR || 0
                            dr[location].energy += itemData.ENERGY_DR || 0
                            dr[location].radiation += itemData.RADIATION_DR || 0
                        }
                    })
                }
            })

            setDamageReduction(dr)
            return
        }

        const locationsDR = character.getLocationsDR()
        setDamageReduction(locationsDR)
    }

    const handleSubTabClick = (subTab) => {
        setActiveSubTab(subTab)
    }

    const handleAddItem = (itemType) => {
        showAddItemPopup(itemType)
    }

    const getItemsByType = (itemType) => {
        if (!character.items) return []

        const items = character.items.filter(item => item.type === itemType)

        // Add special items for unarmed
        if (itemType === 'unarmed') {
            items.push({
                id: 'weaponUnarmedStrike',
                type: itemType,
                quantity: 1,
            })
        }

        return items
    }

    // Get items by category (weapon, apparel, aid, other)
    const getItemsByCategory = (category) => {
        if (!character.items || !dataManager.getItemTypeMap) return []

        const typeMap = dataManager.getItemTypeMap()
        const typesInCategory = typeMap[category] || []

        return character.items.filter(item =>
            typesInCategory.includes(item.type)
        )
    }

    // Render individual item card based on type
    const renderItemCard = (characterItem) => {
        if (!dataManager.getItem) return null

        const [itemId] = characterItem.id.split('_')
        const itemData = dataManager.getItem(itemId)



        if (!itemData) {
            console.warn(`Item data not found for: ${itemId}`)
            return null
        }

        // Determine item category
        const isWeapon = Object.values(SKILLS).includes(characterItem.type)
        const isApparel = ['clothing', 'headgear', 'outfit'].includes(characterItem.type) ||
                         characterItem.type.endsWith('Armor')
        const isAmmo = characterItem.type === 'ammo'

        if (isWeapon) {
            return (
                <WeaponCard
                    key={characterItem.id}
                    characterItem={characterItem}
                    itemData={itemData}
                    dataManager={dataManager}
                />
            )
        } else if (isApparel) {
            return (
                <ApparelCard
                    key={characterItem.id}
                    characterItem={characterItem}
                    itemData={itemData}
                />
            )
        } else if (isAmmo) {
            return (
                <AmmoCard
                    key={characterItem.id}
                    characterItem={characterItem}
                />
            )
        } else {
            // Aid items (food, drinks, meds)
            return (
                <AidCard
                    key={characterItem.id}
                    characterItem={characterItem}
                    itemData={itemData}
                />
            )
        }
    }

    const renderItemSection = (itemType) => {
        const items = getItemsByType(itemType)

        return (
            <section key={itemType}>
                <div className="itemlist-header">
                    <span className="h3 js-title">{t(itemType)}</span>
                    <button className="js-button-addItem" onClick={() => handleAddItem(itemType)}>+</button>
                </div>
                <div className="card-carousel" id={`${itemType}-cards`}>
                    {items.length === 0 ? (
                        <div className="no-items">{t('noItems')}</div>
                    ) : (
                        items.map(item => renderItemCard(item))
                    )}
                </div>
            </section>
        )
    }

    const renderDamageReductionStats = () => {
        return Object.values(BODY_PARTS).map(bodyPart => (
            <div key={bodyPart} className={`apparel-stat ${bodyPart}`}>
                <div>{t(bodyPart)}</div>
                <div className="row l-centered">
                    <span>{t('physical')}:</span>
                    <span id={`apparel__${bodyPart}-physical`}>
                        {damageReduction[bodyPart]?.physical || '?'}
                    </span>
                </div>
                <div className="row l-centered">
                    <span>{t('energy')}:</span>
                    <span id={`apparel__${bodyPart}-energy`}>
                        {damageReduction[bodyPart]?.energy || '?'}
                    </span>
                </div>
                <div className="row l-centered">
                    <span>{t('radiation')}:</span>
                    <span id={`apparel__${bodyPart}-radiation`}>
                        {damageReduction[bodyPart]?.radiation || '?'}
                    </span>
                </div>
            </div>
        ))
    }

    // Item type mapping - matches your original exactly
    const itemTypeMap = {
        weapon: ['smallGuns', 'energyWeapons', 'bigGuns', 'meleeWeapons', 'explosives', 'throwing', 'unarmed'],
        apparel: ['clothing', 'outfit', 'headgear', 'raiderArmor', 'leatherArmor', 'metalArmor', 'combatArmor'],
        aid: ['food', 'drinks', 'meds'],
        other: ['ammo']
    }

    // Show loading state while data is loading
    if (dataManager.isLoading) {
        return (
            <section id="inv-tabContent" className="tabContent">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    color: 'var(--primary-color)',
                    fontSize: '1.2rem'
                }}>
                    {t('loadingItems') || 'Loading items...'}
                </div>
            </section>
        )
    }

    // Show error state if data failed to load
    if (dataManager.error) {
        return (
            <section id="inv-tabContent" className="tabContent">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    color: 'var(--error-color, #ff6b6b)',
                    fontSize: '1.2rem',
                    textAlign: 'center'
                }}>
                    {t('errorLoadingItems') || 'Error loading items'}: {dataManager.error}
                </div>
            </section>
        )
    }

    return (
        <section id="inv-tabContent" className="tabContent">
            {/* Sub-tab Navigation - EXACT copy of original */}
            <div className="navigator">
                <button
                    className={`subTab-button ${activeSubTab === 'weapon' ? 'active' : ''}`}
                    data-sub-screen="weapon"
                    onClick={() => handleSubTabClick('weapon')}
                >
                    {t('weaponsUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'apparel' ? 'active' : ''}`}
                    data-sub-screen="apparel"
                    onClick={() => handleSubTabClick('apparel')}
                >
                    {t('apparelUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'aid' ? 'active' : ''}`}
                    data-sub-screen="aid"
                    onClick={() => handleSubTabClick('aid')}
                >
                    {t('aidUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'other' ? 'active' : ''}`}
                    data-sub-screen="other"
                    onClick={() => handleSubTabClick('other')}
                >
                    {t('otherUpper')}
                </button>
            </div>

            {/* Weapon Sub-screen */}
            <section className={`js-subScreen ${activeSubTab !== 'weapon' ? 'hidden' : ''}`} id="weapon-subScreen">
                {itemTypeMap.weapon.map(weaponType => renderItemSection(weaponType))}
            </section>

            {/* Apparel Sub-screen - EXACT copy of original structure */}
            <section className={`js-subScreen ${activeSubTab !== 'apparel' ? 'hidden' : ''} keep-first`} id="apparel-subScreen">
                <div>
                    <span className="h1">{t('damageReduction')}</span>
                    <div className="row l-spaceAround">
                        <div className="activeApparel l-spaceAround">
                            {renderDamageReductionStats()}
                            <div className="apparel-vaultboy themed-svg" data-icon="vaultboy-open-arms"></div>
                        </div>
                    </div>
                </div>
                {itemTypeMap.apparel.map(apparelType => renderItemSection(apparelType))}
            </section>

            {/* Aid Sub-screen */}
            <section className={`js-subScreen ${activeSubTab !== 'aid' ? 'hidden' : ''}`} id="aid-subScreen">
                {itemTypeMap.aid.map(aidType => renderItemSection(aidType))}
            </section>

            {/* Other Sub-screen */}
            <section className={`js-subScreen ${activeSubTab !== 'other' ? 'hidden' : ''}`} id="other-subScreen">
                {itemTypeMap.other.map(otherType => renderItemSection(otherType))}
            </section>
        </section>
    )
}

export default InvTab