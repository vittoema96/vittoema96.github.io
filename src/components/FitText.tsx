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
                            style={},
                            center = true,
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
        <div style={{
            flex: 1,
            minWidth: 0 ,
            display: 'flex',
            alignItems: 'center',
            justifyContent: center ? 'space-around' : 'flex-start',
            ...style
        }}>
            <div ref={textRef} className={className} style={{
                display: 'inline-block',
                whiteSpace: wrap ? 'normal' : 'nowrap',
                lineHeight: 1,
                width: 'auto'
            }}>
                {children}
            </div>
        </div>
    );
};
