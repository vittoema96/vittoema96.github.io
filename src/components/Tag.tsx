
/**
 * Simple Tag component - just renders a tag span
 * Tooltip functionality is handled globally by TooltipContext
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
