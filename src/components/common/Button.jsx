import React from 'react'

/**
 * Reusable themed button component
 * @param {string} variant - Button variant (primary, secondary, danger, icon)
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 * @param {string} title - Tooltip text
 * @param {string} type - Button type (button, submit, reset)
 */
function Button({
    variant = 'primary',
    onClick,
    disabled = false,
    className = '',
    children,
    title,
    type = 'button'
}) {
    const variantClass = `button-${variant}`
    
    return (
        <button
            type={type}
            className={`${variantClass} ${className}`}
            onClick={onClick}
            disabled={disabled}
            title={title}
        >
            {children}
        </button>
    )
}

export default Button

