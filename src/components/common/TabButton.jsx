import React from 'react'
import PropTypes from 'prop-types';

/**
 * Reusable tab button component
 * @param {string} id - Tab identifier
 * @param {string} label - Tab label text
 * @param {boolean} active - Whether tab is active
 * @param {function} onClick - Click handler
 * @param {React.ReactNode} icon - Optional icon element
 */
function TabButton({ label, active, onClick, icon }) {
    return (
        <button className={`tab-button ${icon ? 'mini-tab-button' : ''} ${active ? 'active' : ''}`}
                onClick={onClick}>
            {icon || label}
        </button>
    )
}
TabButton.propTypes = {
    label: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.node
}

export default TabButton

