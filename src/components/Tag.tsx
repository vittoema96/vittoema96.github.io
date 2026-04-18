/**
 * Simple Tag component - just renders a tag span
 * Tooltip functionality is handled globally by TooltipContext
 */
import React from 'react';


interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    tooltipId?: string;
    isEmpty?: boolean;
    color?: string;
    isMod?: boolean;
}

function Tag({ children, tooltipId, color = undefined, isEmpty = false, isMod = false, className = '', ...props }: Readonly<TagProps>) {

    return (
        <button
            className={"tag " + className}
            data-tooltip-id={tooltipId}
            style={{
                backgroundColor: color ?? (isEmpty ? 'var(--button-background)' : 'var(--primary-color)'),
                color: isEmpty ? 'var(--primary-color)' : 'var(--secondary-color)',
            }}
            {...props}
        >
            {children}
        </button>
    )
}

export default Tag
