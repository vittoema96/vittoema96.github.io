/**
 * Simple Tag component - just renders a tag span
 * Tooltip functionality is handled globally by TooltipContext
 */
import React from 'react';


interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    tooltipId?: string;
    isEmpty?: boolean;
    isMod?: boolean;
}

function Tag({ children, tooltipId, isEmpty = false, isMod = false, className = '', ...props }: Readonly<TagProps>) {
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
