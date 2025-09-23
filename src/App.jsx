import React, { useState, useEffect } from 'react'
import BootScreen from './components/BootScreen.jsx'
import MainApp from './components/MainApp.jsx'
import { useCharacterData } from './hooks/useCharacterData.js'

function App() {
    const [showBootScreen, setShowBootScreen] = useState(true)
    const [version] = useState('DEV')

    // Use the character persistence hook
    const {
        character,
        updateCharacter,
        resetCharacter,
        downloadCharacter,
        uploadCharacter,
        isLoading
    } = useCharacterData()

    // Boot screen timing - adjust based on your CSS animation duration
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowBootScreen(false)
        }, 6000) // Adjust this to match your boot animation timing

        return () => clearTimeout(timer)
    }, [])

    // Don't render until character data is loaded
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: '#afff03',
                fontFamily: 'monospace'
            }}>
                Loading character data...
            </div>
        )
    }

    return (
        <div>
            {/* Boot Screen - shows first */}
            <BootScreen version={version} isVisible={showBootScreen} />

            {/* Main App - shows after boot screen finishes */}
            {!showBootScreen && (
                <MainApp
                    character={character}
                    updateCharacter={updateCharacter}
                    resetCharacter={resetCharacter}
                    downloadCharacter={downloadCharacter}
                    uploadCharacter={uploadCharacter}
                />
            )}
        </div>
    )
}

export default App