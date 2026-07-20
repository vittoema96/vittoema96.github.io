import { useEffect, useState } from 'react';

/** Breakpoint (px) oltre il quale l'app mostra il layout desktop a due pannelli */
export const DESKTOP_MIN_WIDTH = 900;

/**
 * Restituisce `true` se la viewport è abbastanza larga per il layout desktop.
 * Si aggiorna automaticamente al resize della finestra.
 */
function useIsDesktop(): boolean {
    const query = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;
    const [isDesktop, setIsDesktop] = useState<boolean>(
        () => globalThis.window?.matchMedia(query).matches
    );

    useEffect(() => {
        const mql = globalThis.window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return isDesktop;
}

export default useIsDesktop;

