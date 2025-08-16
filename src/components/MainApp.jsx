import React, { useState, useMemo } from 'react'
import StatTab from './tabs/StatTab.jsx'
import InvTab from './tabs/InvTab.jsx'
import DataTab from './tabs/DataTab.jsx'
import MapTab from './tabs/MapTab.jsx'
import SettingsTab from './tabs/SettingsTab.jsx'

import { useCharacter } from '../contexts/CharacterContext.jsx'
import { usePopup } from '../contexts/PopupContext.jsx'

function MainApp() {
    const [activeTab, setActiveTab] = useState('stat')
    const { character, derivedStats } = useCharacter()
    const { showStatAdjustmentPopup } = usePopup()

    // Memoize tabs array to prevent recreation on every render
    const tabs = useMemo(() => [
        { id: 'stat', label: 'STAT', component: StatTab },
        { id: 'inv', label: 'INV', component: InvTab },
        { id: 'data', label: 'DATA', component: DataTab },
        { id: 'map', label: 'MAP', component: MapTab },
        { id: 'settings', label: 'SETTINGS', component: SettingsTab, mini: true }
    ], [])

    // Get active tab component (only render the active one for better performance)
    const ActiveTabComponent = useMemo(() =>
        tabs.find(tab => tab.id === activeTab)?.component,
        [tabs, activeTab]
    )

    // Get derived stats from context (already calculated)
    const { maxHp, maxWeight, currentWeight } = derivedStats

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
            <header className="l-lastSmall">
                <span className="h1">Pip-Boy 3000</span>
                <div
                    id="c-headerStats"
                    onClick={showStatAdjustmentPopup}
                    style={{ cursor: 'pointer' }}
                    title="Click to edit HP, Caps, and Luck"
                >
                    <div className="icon-text-pair">
                        <div className="themed-svg" data-icon="hp"></div>
                        <div>{character.currentHp} / {maxHp}</div>
                    </div>
                    <div className="icon-text-pair">
                        <div className="themed-svg" data-icon="caps"></div>
                        <div>{character.caps || 0}</div>
                    </div>
                    <div className="icon-text-pair">
                        <div className="themed-svg" data-icon="weight"></div>
                        <div>{currentWeight} / {maxWeight}</div>
                    </div>
                </div>
            </header>

            <hr />

            {/* Tab Navigation */}
            <nav className="navigator">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${tab.mini ? 'mini-tab-button' : ''} ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.id === 'settings' ? (
                            <i className="fas fa-gear"></i>
                        ) : (
                            tab.label
                        )}
                    </button>
                ))}
            </nav>

            {/* Tab Content - Only render active tab for better performance */}
            <main id="main-container">
                {ActiveTabComponent && <ActiveTabComponent />}
            </main>
        </div>
    )
}

export default MainApp