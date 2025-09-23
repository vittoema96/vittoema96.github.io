import React from 'react'

function InvTab({ character, updateCharacter }) {
    return (
        <section id="inv-tabContent" className="tabContent">
            <div className="navigator">
                <button className="subTab-button active">WEAPONS</button>
                <button className="subTab-button">APPAREL</button>
                <button className="subTab-button">AID</button>
                <button className="subTab-button">OTHER</button>
            </div>

            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Inventory Tab</h2>
                <p>Items: {character.items.length}</p>
                <p>Caps: {character.caps}</p>
                <p>Coming soon...</p>
            </div>
        </section>
    )
}

export default InvTab