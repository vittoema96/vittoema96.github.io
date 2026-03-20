import React, {useEffect, useRef} from 'react';
import Panzoom, {PanzoomObject} from '@panzoom/panzoom';

export const usePanzoom = () => {
    const mapRef: React.RefObject<HTMLImageElement | null> = useRef(null);
    const panzoomRef: React.RefObject<PanzoomObject | null> = useRef(null);

    useEffect(() => {
        const el = mapRef.current;
        if (!el) { return }

        // Parent container for wheel events
        const parent = el.parentElement;

        const handleWheel = (e: WheelEvent) => panzoom.zoomWithWheel(e);
        parent?.addEventListener('wheel', handleWheel);

        // Initialize instance
        const panzoom = Panzoom(el, {
            maxScale: 15,
            contain: 'outside',
            excludeClass: 'map-marker',
            step: 0.6
        });

        panzoomRef.current = panzoom;

        return () => {
            parent?.removeEventListener('wheel', handleWheel);
            panzoom.destroy();
        };
    }, []);

    return { mapRef, panzoomRef }; // We only need to return the image ref!
};
