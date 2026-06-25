import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'
import Toast from './Toast'

/**
 * PWA update prompt — shown when a new service worker is waiting to activate.
 * Uses the generic Toast component with an "Update" action button.
 *
 * To preview the banner locally, set DEBUG_SHOW = true below.
 */
const DEBUG_SHOW = false // Set to true to force-show the banner during development

export default function UpdatePrompt() {
    const { t } = useTranslation()

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
            // Check for updates every 60 minutes
            if (registration) {
                setInterval(() => { registration.update() }, 60 * 60 * 1000)
            }
        },
        onRegisterError(error: Error) {
            console.error('SW registration error:', error)
        },
    })

    if (!needRefresh && !DEBUG_SHOW) {return null}

    return (
        <Toast
            message={t('updateAvailable')}
            variant="info"
            action={{ label: t('updateNow'), onClick: () => updateServiceWorker(true) }}
            onDismiss={() => setNeedRefresh(false)}
        />
    )
}
