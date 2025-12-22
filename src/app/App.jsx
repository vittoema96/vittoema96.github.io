import React, { useMemo, useState } from 'react'
import StatTab from './tabs/StatTab.jsx'
import InvTab from './tabs/InvTab.jsx'
import DataTab from './tabs/DataTab.jsx'
import MapTab from './tabs/MapTab.jsx'
import SettingsTab from './tabs/SettingsTab.jsx'
import TabButton from '../components/common/TabButton.jsx'
import HeaderStats from "./HeaderStats.jsx";

function App() {
    const [activeTab, setActiveTab] = useState('stat')

    // Memoize tabs array to prevent recreation on every render
    const tabs = useMemo(() => [
        { id: 'stat', component: StatTab },
        { id: 'inv', component: InvTab },
        { id: 'data', component: DataTab },
        { id: 'map', component: MapTab },
        { id: 'settings', component: SettingsTab, icon: <i className="fas fa-gear"/> }
    ], [])

    // Get active tab component (only render the active one for better performance)
    const ActiveTabComponent = useMemo(() =>
            tabs.find(tab => tab.id === activeTab)?.component,
        [activeTab]
    )


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
                {tabs.map(tab => (
                    <TabButton
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}

                        label={tab.id.toUpperCase()}
                        active={activeTab === tab.id}
                        icon={tab.icon}
                    />
                ))}
            </nav>

            {/* Tab Content - Only render active tab for better performance */}
            <main id="main-container">
                {ActiveTabComponent && <ActiveTabComponent />}
            </main>
        </div>
    )
}

export default App