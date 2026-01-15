import { useState } from 'react'
import StatTab from '@/app/tabs/stat/StatTab'
import InvTab from '@/app/tabs/inv/InvTab'
import DataTab from '@/app/tabs/data/DataTab'
import MapTab from '@/app/tabs/map/MapTab'
import SettingsTab from '@/app/tabs/settings/SettingsTab'
import TabButton, {TabType} from '@/app/tabs/TabButton'
import HeaderStats from "@/app/HeaderStats";

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
