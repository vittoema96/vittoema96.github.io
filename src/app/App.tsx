import { useState, useMemo } from 'react'
import CompanionTab from '@/features/companion/CompanionTab'
import StatTab from '@/features/stat/StatTab'
import InvTab from '@/features/inv/InvTab'
import DataTab from '@/features/data/DataTab'
import MapTab from '@/features/map/MapTab'
import SettingsTab from '@/features/settings/SettingsTab'
import TabButton, { TabType } from '@/features/TabButton'
import AppHeader from "@/app/AppHeader.tsx";
import { useCharacter } from '@/contexts/CharacterContext'

const TABS = {
    companion: CompanionTab,
    stat: StatTab,
    inv: InvTab,
    data: DataTab,
    map: MapTab,
    settings: SettingsTab
} as const

function App() {
    const { character } = useCharacter()
    const [activeTab, setActiveTab] = useState<TabType>('stat')

    // Check if player has Robot Wrangler perk
    const hasRobotWrangler = character.perks?.includes('perkRobotWrangler') ?? false

    // Filter visible tabs based on perks
    const visibleTabs = useMemo(() => {
        const allTabs = Object.keys(TABS) as TabType[]
        return allTabs.filter(tabType => {
            // Hide companion tab if player doesn't have Robot Wrangler perk
            if (tabType === 'companion' && !hasRobotWrangler) {
                return false
            }
            return true
        })
    }, [hasRobotWrangler])

    // Get active tab component (only render the active one for better performance)
    const ActiveTabComponent = TABS[activeTab]


    return (
        <div style={{
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden' // Prevent body scroll, let main-container handle it
            }}
        >
            <AppHeader />

            <hr />

            {/* Tab Navigation */}
            <nav className="navigator">
                {visibleTabs.map((tabType) => (
                    <TabButton
                        key={tabType}
                        onClick={() => setActiveTab(tabType)}

                        tabType={tabType}
                        active={activeTab === tabType}
                    />
                ))}
            </nav>

            {/* Tab Content - Only render active tab for better performance */}
            <main id="main-container">
                <ActiveTabComponent />
            </main>
        </div>
    )
}

export default App
