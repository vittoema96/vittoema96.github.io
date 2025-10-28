import React from 'react'

/**
 * Reusable component for icon-text pairs (HP, Caps, Weight, etc.)
 * @param {string} icon - Icon identifier (hp, caps, weight, etc.)
 * @param {string|number} text - Text to display next to icon
 * @param {function} onClick - Optional click handler
 * @param {string} title - Optional tooltip text
 * @param {string} className - Optional additional CSS classes
 */
function IconTextPair({ icon, text, onClick, title, className = '' }) {
    return (
        <div
            className={`icon-text-pair ${className}`}
            onClick={onClick}
            title={title}
            style={onClick ? { cursor: 'pointer' } : undefined}
        >
            <div className="themed-svg" data-icon={icon}></div>
            <div>{text}</div>
        </div>
    )
}

export default IconTextPair

