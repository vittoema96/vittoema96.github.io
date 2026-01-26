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
            maxScale: 9,
            contain: 'outside',
            excludeClass: 'map-marker',
        });

        panzoomRef.current = panzoom;

        // Auto-fit logic once image loads
        el.onload = () => {
            console.log("Fitting to container")
            if (parent) {
                const containerRect = parent.getBoundingClientRect();
                const scale = Math.max(
                    containerRect.width / el.naturalWidth,
                    containerRect.height / el.naturalHeight
                );
                const x = (containerRect.width - el.naturalWidth * scale) / 2 / scale;
                const y = (containerRect.height - el.naturalHeight * scale) / 2 / scale;

                panzoom.zoom(scale, {animate: false})
                requestAnimationFrame(() => {
                    panzoom.pan(x, y, {relative: true, animate: false})
                })
            }
        };

        return () => {
            parent?.removeEventListener('wheel', handleWheel);
            panzoom.destroy();
        };
    }, []);

    return { mapRef, panzoomRef }; // We only need to return the image ref!
};
