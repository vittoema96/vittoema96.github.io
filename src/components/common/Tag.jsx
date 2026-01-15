import React from 'react'

/**
 * Simple Tag component - just renders a tag span
 * Tooltip functionality is handled globally by TooltipContext
 *
 * @param {React.ReactNode} children - Tag content
 * @param {string} [tooltipId] - Optional tooltip ID for tooltip context
 * @param {boolean} [isEmpty=false] - If true, renders as quality tag (transparent bg, green text/border)
 * @param {boolean} [isMod=false] - If true, renders as mod effect tag (transparent bg, orange text/border)
 * @param {string} [className=''] - Additional CSS classes
 * @param {Object} props - Additional props to spread on the span element
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
