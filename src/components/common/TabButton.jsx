import React from 'react'

/**
 * Reusable tab button component
 * @param {string} id - Tab identifier
 * @param {string} label - Tab label text
 * @param {boolean} active - Whether tab is active
 * @param {boolean} mini - Whether to use mini style
 * @param {function} onClick - Click handler
 * @param {React.ReactNode} icon - Optional icon element
 */
function TabButton({ id, label, active, mini = false, onClick, icon }) {
    return (
        <button
            className={`tab-button ${mini ? 'mini-tab-button' : ''} ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            {icon || label}
        </button>
    )
}

export default TabButton

