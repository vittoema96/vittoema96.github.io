import React from 'react'

/**
 * Reusable SPECIAL stat display component
 * @param {string} name - SPECIAL stat name (translated)
 * @param {number} value - SPECIAL stat value
 * @param {function} onClick - Optional click handler
 * @param {boolean} editable - Whether stat is editable (shows cursor pointer)
 * @param {React.ReactNode} children - Optional children (e.g., sub-special for Luck)
 */
function SpecialStat({ name, value, onClick, editable = false, children }) {
    return (
        <div
            className="special"
            onClick={onClick}
            style={{ cursor: editable ? 'pointer' : 'default' }}
        >
            <span className="special__name">{name}</span>
            <span className="special__value">{value}</span>
            {children}
        </div>
    )
}

export default SpecialStat

