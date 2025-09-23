import React, { useState } from 'react'
import StatTab from './tabs/StatTab.jsx'
import InvTab from './tabs/InvTab.jsx'
import DataTab from './tabs/DataTab.jsx'
import MapTab from './tabs/MapTab.jsx'
import SettingsTab from './tabs/SettingsTab.jsx'

function MainApp({ character, updateCharacter, downloadCharacter, uploadCharacter, resetCharacter }) {
    const [activeTab, setActiveTab] = useState('stat')

    const tabs = [
        { id: 'stat', label: 'STAT', component: StatTab },
        { id: 'inv', label: 'INV', component: InvTab },
        { id: 'data', label: 'DATA', component: DataTab },
        { id: 'map', label: 'MAP', component: MapTab },
        { id: 'settings', label: 'SETTINGS', component: SettingsTab, mini: true }
    ]

    const handleTabClick = (tabId) => {
        setActiveTab(tabId)
    }

    const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component

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
            {/* Header with character stats */}
            <header id="c-headerStats">
                <div className="row l-distributed">
                    <span className="h3" id="c-headerStats__name">
                        {character.name || 'Vault Dweller'}
                    </span>
                    <span className="h3" id="c-headerStats__level">
                        LVL {character.level}
                    </span>
                </div>
                <div className="row l-distributed">
                    <span className="h5" id="c-headerStats__hp">
                        HP: {character.currentHp}
                    </span>
                    <span className="h5" id="c-headerStats__weight">
                        Weight: 0/100 {/* Calculate actual weight */}
                    </span>
                </div>
            </header>

            <hr />

            {/* Tab Navigation */}
            <nav className="navigator">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${tab.mini ? 'mini-tab-button' : ''} ${activeTab === tab.id ? 'active' : ''}`}
                        data-tab-id={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                    >
                        {tab.id === 'settings' ? (
                            <i className="fas fa-gear"></i>
                        ) : (
                            tab.label
                        )}
                    </button>
                ))}
            </nav>

            {/* Tab Content */}
            <main id="main-container">
                {ActiveTabComponent && (
                    <ActiveTabComponent
                        character={character}
                        updateCharacter={updateCharacter}
                        downloadCharacter={activeTab === 'settings' ? downloadCharacter : undefined}
                        uploadCharacter={activeTab === 'settings' ? uploadCharacter : undefined}
                        resetCharacter={activeTab === 'settings' ? resetCharacter : undefined}
                        isActive={true}
                    />
                )}
            </main>
        </div>
    )
}

export default MainApp