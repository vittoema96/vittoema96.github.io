import React, { useEffect, useRef } from 'react';
import fitty from 'fitty';

interface FitTextProps {
    children: React.ReactNode;
    minSize?: number;
    maxSize?: number;
    style?: React.CSSProperties;
    center?: boolean;
    wrap?: boolean; // explicit prop to handle multi-line vs single-line
    className?: string;
}

export const FitText = ({
    children,
    minSize = 10,
    maxSize = 100,
    style = {},
    center = true,
    wrap = false,
    className,
}: FitTextProps) => {
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!textRef.current) {
            return;
        }

        // Initialize fitty
        const fitInstance = fitty(textRef.current, {
            minSize,
            maxSize,
            multiLine: wrap, // fitty handles multi-line wrapping beautifully
        });

        // fitty only refits on window resize. Refit whenever the container itself changes size
        // (e.g. the header's stats getting wider or narrower), so the text never runs underneath.
        const container = textRef.current.parentElement;
        const observer =
            container && typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(() => fitInstance.fit())
                : null;
        if (container) {
            observer?.observe(container);
        }

        // Cleanup on unmount to prevent memory leaks
        return () => {
            observer?.disconnect();
            fitInstance.unsubscribe();
        };
    }, [children, minSize, maxSize, wrap]);

    return (
        <div
            style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: center ? 'space-around' : 'flex-start',
                ...style,
            }}
        >
            <div
                ref={textRef}
                className={className}
                style={{
                    display: 'inline-block',
                    whiteSpace: wrap ? 'normal' : 'nowrap',
                    lineHeight: 1,
                    width: 'auto',
                }}
            >
                {children}
            </div>
        </div>
    );
};
