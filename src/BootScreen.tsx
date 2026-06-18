import { useEffect, useState } from 'react';


/** Set to true to force the boot screen even in dev mode. */
const FORCE_BOOT_SCREEN = false;
/** Show boot screen only in production builds (where BUILD_VERSION is replaced by Vite). */
const IS_PRODUCTION = !__APP_VERSION__.includes('BUILD_VERSION');
export const useBootScreen = () => {
    const [showBootScreen, setShowBootScreen] = useState(IS_PRODUCTION || FORCE_BOOT_SCREEN);
    useEffect(() => {
        if (!showBootScreen) {
            return;
        }

        const timer = setTimeout(() => {
            setShowBootScreen(false);
        }, 6000); // Minimum display time for boot screen (ms)

        return () => clearTimeout(timer);
    }, [showBootScreen]);
    return showBootScreen;
};


export default function BootScreen() {
    return (
        <div id="loader">
            <pre>
                <span className="turn-on-animation">
{`██████╗ ██╗██████╗       ██████╗  █████╗██╗   ██╗
██╔══██╗██║██╔══██╗      ██╔══██╗██╔══██╬██╗ ██╔╝
██████╔╝██║██████╔╝█████╗██████╔╝██║  ██║╚████╔╝
██╔═══╝ ██║██╔═══╝ ╚════╝██╔══██╗██║  ██║ ╚██╔╝
██║     ██║██║           ██████╔╝╚█████╔╝  ██║
╚═╝     ╚═╝╚═╝           ╚═════╝  ╚════╝   ╚═╝

      ██████╗  ██████╗  ██████╗  ██████╗
      ╚════██╗██╔═████╗██╔═████╗██╔═████╗
       █████╔╝██║██╔██║██║██╔██║██║██╔██║
       ╚═══██╗████╔╝██║████╔╝██║████╔╝██║
      ██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝
      ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝`}
                </span>
                <span className="boot-text">&gt; ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL</span>
                <span className="boot-text">&gt; COPYRIGHT 2075-2077 ROBCO INDUSTRIES</span>
                <span className="boot-text">&gt; LOADER {__APP_VERSION__}</span>
                <span className="boot-text">&gt; WELCOME, OVERSEER</span>
            </pre>
            {/* Easily readable alpha version TODO edit when moving to beta / stable */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    padding: 'var(--space-m)',
                    fontSize: 'var(--space-m)',
                }}
            >
                v{__APP_VERSION__.split('.').at(-1)}
            </div>
        </div>
    );
}
