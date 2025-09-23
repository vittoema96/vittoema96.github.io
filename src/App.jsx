import React, { useState, useEffect } from 'react'
import BootScreen from './components/BootScreen.jsx'
import StatDisplay from './components/StatDisplay.jsx'
import { useCharacterData } from './hooks/useCharacterData.js'

function App() {
    const [showBootScreen, setShowBootScreen] = useState(true)
    const [version] = useState('DEV') // We'll make this dynamic later
    const {
        character,
        updateCharacter,
        resetCharacter,
        downloadCharacter,
        uploadCharacter,
        isLoading
    } = useCharacterData()

    // Hide boot screen after 6 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowBootScreen(false)
        }, 6000)
        return () => clearTimeout(timer) // Cleanup
    }, [])

    if (isLoading) {
        return <div>Loading character data...</div>
    }
    return (
        <div>
            <BootScreen version={version} isVisible={showBootScreen} />

            {!showBootScreen && (
                <div className="main-app">
                    <header>
                        <h1>Pip-Boy 3000</h1>

                        {/* Character backup functionality */}
                        <div className="backup-controls">
                            <button onClick={downloadCharacter}>
                                Download Character
                            </button>

                            <input
                                type="file"
                                accept=".json"
                                onChange={(e) => {
                                    if (e.target.files[0]) {
                                        uploadCharacter(e.target.files[0])
                                            .then(() => alert('Character uploaded successfully!'))
                                            .catch(err => alert(`Upload failed: ${err.message}`))
                                    }
                                }}
                            />

                            <button onClick={resetCharacter}>
                                Reset Character
                            </button>
                        </div>
                    </header>

                    <main>
                        {/* Pass character data and update function as props */}
                        <StatDisplay
                            character={character}
                            updateCharacter={updateCharacter}
                        />
                    </main>
                </div>
            )}
        </div>
    )
}

export default App