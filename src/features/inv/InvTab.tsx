import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInventoryFilter } from '@/features/inv/hooks/useInventoryFilter.ts'
import InventoryList from '@/features/inv/components/InventoryList.tsx'
import EquippedApparel from '@/features/inv/components/EquippedApparel.tsx'
import ActiveEffectsDisplay from '@/features/ActiveEffectsDisplay.tsx'

export const SUBTABS = [
    "weapon",
    "apparel",
    "aid",
    "ammo",
    "other",
] as const

// SpecialType includes both player and companion SPECIAL stats for polymorphic character structure
type SubtabType = (typeof SUBTABS)[number]

function InvTab() {
    const { t } = useTranslation()
    const [activeSubTab, setActiveSubTab] = useState<SubtabType>('weapon')

    // Get filtered items for active category
    const items = useInventoryFilter(activeSubTab)

    return (
        <section className="tabContent">
            {/* Sub-tab Navigation - EXACT copy of original */}
            <nav>
                {SUBTABS.map(subtab => (
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
