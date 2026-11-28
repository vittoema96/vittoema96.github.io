import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './ErrorBoundary';
import { CharacterProvider } from '@/app/contexts/CharacterContext';
import { TooltipProvider } from '@/app/contexts/TooltipContext';
import { PopupProvider } from '@/app/contexts/PopupContext';
import BootScreen, { useBootScreen } from '@/BootScreen';
import App from '@/app/App';
import UpdateRequestToast from '@/app/components/UpdateRequestToast.tsx';

/**
 * Root component — orchestrates startup sequence:
 * - Boot screen (production only, timed)
 * - Global context providers (Character, Tooltip, Popup)
 * - Error boundary
 */
export function Root() {
    const showBootScreen = useBootScreen();

    return (
        <ErrorBoundary fallbackRender={ErrorFallback}>
            {showBootScreen && <BootScreen />}
            <CharacterProvider>
                <TooltipProvider>
                    <PopupProvider>
                        <App />
                    </PopupProvider>
                </TooltipProvider>
            </CharacterProvider>
            <UpdateRequestToast />
        </ErrorBoundary>
    );
}
