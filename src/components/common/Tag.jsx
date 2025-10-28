import React from 'react'

/**
 * Simple Tag component - just renders a tag span
 * Tooltip functionality is handled globally by TooltipContext
 *
 * @param {boolean} isEmpty - If true, renders as quality tag (transparent bg, green text/border)
 * @param {boolean} isMod - If true, renders as mod effect tag (transparent bg, orange text/border)
 */
function Tag({ children, tooltipId, isEmpty = false, isMod = false, className = '', ...props }) {
    const tagClasses = [
        'tag',
        isEmpty ? 'tag-empty' : '',
        isMod ? 'tag-mod' : '',
        className
    ].filter(Boolean).join(' ')

    return (
        <span
            className={tagClasses}
            data-tooltip-id={tooltipId}
            {...props}
        >
            {children}
        </span>
    )
}

export default Tag
