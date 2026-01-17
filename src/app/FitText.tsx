import React, { useEffect, useRef } from 'react';
import fitty from 'fitty';

interface FitTextProps {
    children: React.ReactNode;
    minSize?: number;
    maxSize?: number;
    wrap?: boolean; // explicit prop to handle multi-line vs single-line
    className?: string;
}

export const FitText = ({
                            children,
                            minSize = 10,
                            maxSize = 100,
                            wrap = false,
                            className
                        }: FitTextProps) => {
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!textRef.current) {return;}

        // Initialize fitty
        const fitInstance = fitty(textRef.current, {
            minSize,
            maxSize,
            multiLine: wrap, // fitty handles multi-line wrapping beautifully
        });

        // Cleanup on unmount to prevent memory leaks
        return () => {
            fitInstance.unsubscribe();
        };
    }, [children, minSize, maxSize, wrap]);

    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <div ref={textRef} className={className} style={{
                display: 'block',
                whiteSpace: wrap ? 'normal' : 'nowrap',
                width: '100%',
                minWidth: 0,
                maxWidth: "100%"
            }}>
                {children}
            </div>
        </div>
    );
};
