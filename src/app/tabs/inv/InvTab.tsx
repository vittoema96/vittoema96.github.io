import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { useInventoryFilter } from '@/hooks/useInventoryFilter.ts'
import InventoryList from '@/app/tabs/inv/InventoryList.tsx'
import EquippedApparel from '@/app/tabs/inv/EquippedApparel.tsx'
import EquippedArmorEffects from '@/app/tabs/EquippedArmorEffects.tsx'
import {BODY_PARTS} from "@/types";

type SubtabType = 'weapon' | 'apparel' | 'aid' | 'other'

function InvTab() {
    const { t } = useTranslation()
    const [activeSubTab, setActiveSubTab] = useState<SubtabType>('weapon')
    const { character } = useCharacter()

    // Get filtered items for active category
    const items = useInventoryFilter(activeSubTab)

    const handleSubTabClick = (subTab: SubtabType) => {
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
            <section className={`js-subScreen ${activeSubTab === 'weapon' ? '' : 'hidden'}`}>
                <InventoryList
                    items={items}
                    showSearch={true}
                    groupByType={false}
                    typeFilter="weapon"
                />
            </section>

            {/* Apparel Sub-screen - Equipped Items + Accordion List */}
            <section className={`js-subScreen ${activeSubTab === 'apparel' ? '' : 'hidden'} keep-first`}>
                {/* Equipped Apparel Display */}
                {character.origin.bodyParts === BODY_PARTS && <EquippedApparel/>}

                {/* Active Effects from Equipped Armor */}
                <EquippedArmorEffects
                    equippedItems={character.items.filter(item => item.equipped)}
                />

                <InventoryList
                    items={items}
                    showSearch={true}
                    groupByType={false}
                    typeFilter="apparel"
                />
            </section>

            {/* Aid Sub-screen - Accordion List */}
            <section className={`js-subScreen ${activeSubTab !== 'aid' ? 'hidden' : ''}`}>
                <InventoryList
                    items={items}
                    showSearch={true}
                    groupByType={false}
                    typeFilter="aid"
                />
            </section>

            {/* Other Sub-screen - Accordion List */}
            <section className={`js-subScreen ${activeSubTab !== 'other' ? 'hidden' : ''}`}>
                <InventoryList
                    items={items}
                    showSearch={true}
                    groupByType={false}
                    typeFilter="other"
                />
            </section>
        </section>
    )
}

export default InvTab
