import React, { useState } from 'react'
import { SKILLS } from '../../js/constants.js'
import { useI18n } from '../../hooks/useI18n.js'
import { useDataManager } from '../../hooks/useDataManager.js'
import { usePopup } from '../../contexts/PopupContext.jsx'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import InventoryList from '../inventory/InventoryList.jsx'
import EquippedApparel from '../inventory/EquippedApparel.jsx'
import { getMeleeWeaponForMod } from '../../utils/itemUtils.js'

function InvTab() {
    const [activeSubTab, setActiveSubTab] = useState('weapon')
    const t = useI18n()
    const dataManager = useDataManager()
    const { showAddItemPopup } = usePopup()
    const { character } = useCharacter()

    const handleSubTabClick = (subTab) => {
        setActiveSubTab(subTab)
    }

    const handleAddItem = (itemType) => {
        showAddItemPopup(itemType)
    }

    // Get items by category (weapon, apparel, aid, other)
    const getItemsByCategory = (category) => {
        if (!character.items || !dataManager.getItemTypeMap) return []

        const typeMap = dataManager.getItemTypeMap()
        const typesInCategory = typeMap[category] || []

        let items = character.items.filter(item =>
            typesInCategory.includes(item.type)
        )

        // Add special items for weapon category
        if (category === 'weapon') {
            // Add unarmed strike
            items.push({
                id: 'weaponUnarmedStrike',
                type: 'unarmed',
                quantity: 1,
            })

            // Add gun bash items (weapon stock) for ranged weapons
            // Aggregate quantities by type (1-handed vs 2-handed)
            let oneHandedGunBashQty = 0
            let twoHandedGunBashQty = 0

            character.items.forEach(item => {
                const itemData = dataManager.getItem(item.id)
                if (itemData && dataManager.isType(item.type, 'weapon')) {
                    // Check if it's a ranged weapon (not melee, unarmed, throwing, or explosives)
                    const meleeTypes = ['meleeWeapons', 'unarmed', 'throwing', 'explosives']
                    if (!meleeTypes.includes(item.type)) {
                        // This is a ranged weapon - count for gun bash
                        const qualities = itemData.QUALITIES || []
                        const isTwoHanded = qualities.includes('qualityTwoHanded')

                        if (isTwoHanded) {
                            twoHandedGunBashQty += item.quantity
                        } else {
                            oneHandedGunBashQty += item.quantity
                        }
                    }
                }
            })

            // Add aggregated gun bash items
            if (oneHandedGunBashQty > 0) {
                items.push({
                    id: 'weaponWeaponStockOneHanded',
                    type: 'meleeWeapons',
                    quantity: oneHandedGunBashQty
                })
            }
            if (twoHandedGunBashQty > 0) {
                items.push({
                    id: 'weaponWeaponStock',
                    type: 'meleeWeapons',
                    quantity: twoHandedGunBashQty
                })
            }

            // Add melee weapons from mods (bayonet, shredder, etc.)
            // Aggregate quantities by melee weapon type
            const meleeWeaponCounts = {}

            character.items.forEach(item => {
                const mods = item.mods || []
                mods.forEach(modId => {
                    const weaponId = getMeleeWeaponForMod(modId)
                    if (weaponId) {
                        meleeWeaponCounts[weaponId] = (meleeWeaponCounts[weaponId] || 0) + item.quantity
                    }
                })
            })

            // Add aggregated melee weapons from mods
            Object.entries(meleeWeaponCounts).forEach(([weaponId, quantity]) => {
                items.push({
                    id: weaponId,
                    type: 'meleeWeapons',
                    quantity: quantity
                })
            })
        }

        return items
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
            <section className="tabContent">
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
            <section className="tabContent">
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
        <section className="tabContent">
            {/* Sub-tab Navigation - EXACT copy of original */}
            <div className="navigator">
                <button
                    className={`subTab-button ${activeSubTab === 'weapon' ? 'active' : ''}`}
                    onClick={() => handleSubTabClick('weapon')}
                >
                    {t('weaponsUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'apparel' ? 'active' : ''}`}
                    onClick={() => handleSubTabClick('apparel')}
                >
                    {t('apparelUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'aid' ? 'active' : ''}`}
                    onClick={() => handleSubTabClick('aid')}
                >
                    {t('aidUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'other' ? 'active' : ''}`}
                    onClick={() => handleSubTabClick('other')}
                >
                    {t('otherUpper')}
                </button>
            </div>

            {/* Weapon Sub-screen - Accordion List */}
            <section className={`js-subScreen ${activeSubTab !== 'weapon' ? 'hidden' : ''}`}>
                <InventoryList
                    items={getItemsByCategory('weapon')}
                    dataManager={dataManager}
                    autoCollapse={true}
                    showSearch={true}
                    groupByType={false}
                    categoryFilter="weapon"
                />
            </section>

            {/* Apparel Sub-screen - Equipped Items + Accordion List */}
            <section className={`js-subScreen ${activeSubTab !== 'apparel' ? 'hidden' : ''} keep-first`}>
                {/* Equipped Apparel Display */}
                <EquippedApparel
                    equippedItems={character.items.filter(item => item.equipped === true)}
                />

                <InventoryList
                    items={getItemsByCategory('apparel')}
                    dataManager={dataManager}
                    autoCollapse={true}
                    showSearch={true}
                    groupByType={false}
                    categoryFilter="apparel"
                />
            </section>

            {/* Aid Sub-screen - Accordion List */}
            <section className={`js-subScreen ${activeSubTab !== 'aid' ? 'hidden' : ''}`}>
                <InventoryList
                    items={getItemsByCategory('aid')}
                    dataManager={dataManager}
                    autoCollapse={true}
                    showSearch={true}
                    groupByType={false}
                    categoryFilter="aid"
                />
            </section>

            {/* Other Sub-screen - Accordion List */}
            <section className={`js-subScreen ${activeSubTab !== 'other' ? 'hidden' : ''}`}>
                <InventoryList
                    items={getItemsByCategory('other')}
                    dataManager={dataManager}
                    autoCollapse={true}
                    showSearch={true}
                    groupByType={false}
                    categoryFilter="other"
                />
            </section>
        </section>
    )
}

export default InvTab