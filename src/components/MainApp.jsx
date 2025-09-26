import React, { useState } from 'react'
import StatTab from './tabs/StatTab.jsx'
import InvTab from './tabs/InvTab.jsx'
import DataTab from './tabs/DataTab.jsx'
import MapTab from './tabs/MapTab.jsx'
import SettingsTab from './tabs/SettingsTab.jsx'
import { getMaxHp, getMaxWeight } from '../js/gameRules.js'
import { useDataManager } from '../hooks/useDataManager.js'

function MainApp({ character, updateCharacter, downloadCharacter, uploadCharacter, resetCharacter }) {
    const [activeTab, setActiveTab] = useState('stat')
    const dataManager = useDataManager()

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

    // Calculate derived stats for header
    const maxHp = getMaxHp(character)
    const maxWeight = getMaxWeight(character)

    // Calculate current weight from inventory
    const currentWeight = character.items?.reduce((total, item) => {
        const [itemId] = item.id.split('_')
        const itemData = dataManager.getItem ? dataManager.getItem(itemId) : null
        const weight = itemData?.WEIGHT || 0
        return total + (weight * item.quantity)
    }, 0) || 0

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
            {/* Header - EXACT copy of original structure */}
            <header className="l-lastSmall">
                <span className="h1">Pip-Boy 3000</span>
                <div id="c-headerStats">
                    <div className="icon-text-pair">
                        <div className="themed-svg" data-icon="hp"></div>
                        <div id="c-headerStats__hp">{character.currentHp} / {maxHp}</div>
                    </div>
                    <div className="icon-text-pair">
                        <div className="themed-svg" data-icon="caps"></div>
                        <div id="c-headerStats__caps">{character.caps || 0}</div>
                    </div>
                    <div className="icon-text-pair">
                        <div className="themed-svg" data-icon="weight"></div>
                        <div id="c-headerStats__weight">{currentWeight} / {maxWeight}</div>
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