import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import { useInventoryFilter } from '@/app/tabs/inv/hooks/useInventoryFilter.ts'
import InventoryList from '@/app/tabs/inv/components/InventoryList.tsx'
import EquippedApparel from '@/app/tabs/inv/components/EquippedApparel.tsx'
import ActiveEffectsDisplay from '@/app/tabs/ActiveEffectsDisplay.tsx'
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
            <nav className="navigator">
                <button
                    className={`subTab-button ${activeSubTab === 'weapon' ? 'active' : ''}`}
                    onClick={() => handleSubTabClick('weapon')}
                >
                    {t('weapons').toUpperCase()}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'apparel' ? 'active' : ''}`}
                    onClick={() => handleSubTabClick('apparel')}
                >
                    {t('apparel').toUpperCase()}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'aid' ? 'active' : ''}`}
                    onClick={() => handleSubTabClick('aid')}
                >
                    {t('aid').toUpperCase()}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'other' ? 'active' : ''}`}
                    onClick={() => handleSubTabClick('other')}
                >
                    {t('other').toUpperCase()}
                </button>
            </nav>

            {/* Weapon Sub-screen - Accordion List */}
            {activeSubTab === 'weapon' && <section className={`js-subScreen`}>
                <InventoryList
                    items={items}
                    showSearch={true}
                    groupByType={false}
                    typeFilter="weapon"
                />
            </section>}

            {/* Apparel Sub-screen - Equipped Items + Accordion List */}
            {activeSubTab === 'apparel' && <section className={`js-subScreen keep-first`}>
                {/* Equipped Apparel Display */}
                {!character.origin.isRobot && <EquippedApparel/>}

                {/* Active Effects from Equipped Armor */}
                <ActiveEffectsDisplay/>

                <InventoryList
                    items={items}
                    showSearch={true}
                    groupByType={false}
                    typeFilter="apparel"
                />
            </section>}

            {/* Aid Sub-screen - Accordion List */}
            {activeSubTab === 'aid' && <section className={`js-subScreen`}>
                <InventoryList
                    items={items}
                    showSearch={true}
                    groupByType={false}
                    typeFilter="aid"
                />
            </section>}

            {/* Other Sub-screen - Accordion List */}
            {activeSubTab === 'other' && <section className={`js-subScreen`}>
                <InventoryList
                    items={items}
                    showSearch={true}
                    groupByType={false}
                    typeFilter="other"
                />
            </section>}
        </section>
    )
}

export default InvTab
