import React, { useState } from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { usePopup } from '../../contexts/PopupContext.jsx'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { useDataManager } from '../../hooks/useDataManager.js'
import { useInventoryFilter } from '../../hooks/useInventoryFilter.js'
import InventoryList from '../inventory/InventoryList.jsx'
import EquippedApparel from '../inventory/EquippedApparel.jsx'
import EquippedArmorEffects from '../inventory/EquippedArmorEffects.jsx'

function InvTab() {
    const [activeSubTab, setActiveSubTab] = useState('weapon')
    const t = useI18n()
    const { showAddItemPopup } = usePopup()
    const { character } = useCharacter()
    const dataManager = useDataManager()

    // Get filtered items for active category
    const items = useInventoryFilter(activeSubTab)

    const handleSubTabClick = (subTab) => {
        setActiveSubTab(subTab)
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
                    items={items}
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

                {/* Active Effects from Equipped Armor */}
                <EquippedArmorEffects
                    equippedItems={character.items.filter(item => item.equipped === true)}
                />

                <InventoryList
                    items={items}
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
                    items={items}
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
                    items={items}
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