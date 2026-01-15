import { useState } from 'react'
import StatTab from './tabs/stat/StatTab.tsx'
import InvTab from './tabs/inv/InvTab.tsx'
import DataTab from './tabs/data/DataTab.tsx'
import MapTab from './tabs/map/MapTab.tsx'
import SettingsTab from './tabs/settings/SettingsTab.tsx'
import TabButton, {TabType} from '@/app/tabs/TabButton.tsx'
import HeaderStats from "./HeaderStats.tsx";

const TABS = {
    stat: StatTab,
    inv: InvTab,
    data: DataTab,
    map: MapTab,
    settings: SettingsTab
} as const

function App() {
    const [activeTab, setActiveTab] = useState<TabType>('stat')

    // Get active tab component (only render the active one for better performance)
    const ActiveTabComponent = TABS[activeTab]


    return (
        <div
            id="main"
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden' // Prevent body scroll, let main-container handle it
            }}
        >
            <HeaderStats />

            <hr />

            {/* Tab Navigation */}
            <nav className="navigator">
                {(Object.keys(TABS) as TabType[]).map((tabType) => (
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
