import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import { useInventoryFilter } from '@/features/inv/hooks/useInventoryFilter.ts'
import InventoryList from '@/features/inv/components/InventoryList.tsx'
import EquippedApparel from '@/features/inv/components/EquippedApparel.tsx'
import ActiveEffectsDisplay from '@/features/ActiveEffectsDisplay.tsx'

type SubtabType = 'weapon' | 'apparel' | 'aid' | 'other'

function InvTab() {
    const { t } = useTranslation()
    const [activeSubTab, setActiveSubTab] = useState<SubtabType>('weapon')
    const { character } = useCharacter()

    // Get filtered items for active category
    const items = useInventoryFilter(activeSubTab)

    return (
        <section className="tabContent">
            {/* Sub-tab Navigation - EXACT copy of original */}
            <nav>
                {['weapon', 'apparel', 'aid', 'other'].map(subtab => (
                    <button
                        key={subtab}
                        className={`subTab-button ${activeSubTab === subtab ? 'active' : ''}`}
                        onClick={() => setActiveSubTab(subtab)}
                    >
                        {t(subtab).toUpperCase()}
                    </button>
                ))}
            </nav>

            {activeSubTab === 'apparel' && (
                <>
                    <EquippedApparel />
                    <ActiveEffectsDisplay />
                </>
            )}
            <InventoryList items={items} typeFilter={activeSubTab} />
        </section>
    );
}

export default InvTab
