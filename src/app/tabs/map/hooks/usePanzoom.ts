import { useEffect, useRef } from 'react';
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom';

export const usePanzoom = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const panzoomRef = useRef<PanzoomObject | null>(null);

    useEffect(() => {
        const el = mapRef.current;
        const parent = el?.parentElement;
        if (!el || !parent) {
            return;
        }

        const panzoom = Panzoom(el, {
            maxScale: 15,
            contain: 'outside',
            excludeClass: 'map-marker',
            step: 0.6,
        });

        panzoomRef.current = panzoom;
        const handleWheel = (event: WheelEvent) => panzoom.zoomWithWheel(event);
        parent.addEventListener('wheel', handleWheel, { passive: false });

        let frame: number | undefined;
        const resizeObserver = new ResizeObserver(() => {
            panzoom.zoom(panzoom.getScale(), { animate: false });
            if (frame !== undefined) {
                cancelAnimationFrame(frame);
            }
            // Constrain the pan after the resized zoom transform has been applied.
            frame = requestAnimationFrame(() => {
                const { x, y } = panzoom.getPan();
                panzoom.pan(x, y, { animate: false });
            });
        });
        resizeObserver.observe(parent);

        return () => {
            resizeObserver.disconnect();
            if (frame !== undefined) {
                cancelAnimationFrame(frame);
            }
            parent.removeEventListener('wheel', handleWheel);
            panzoom.destroy();
            panzoomRef.current = null;
        };
    }, []);

    return { mapRef, panzoomRef };
};
