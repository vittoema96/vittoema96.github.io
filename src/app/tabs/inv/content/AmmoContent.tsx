import { useTranslation } from 'react-i18next'

/**
 * Ammo-specific content renderer
 * Simple display for ammunition items
 */
function AmmoContent({ characterItem }) {
    const { t } = useTranslation()

    // Ammo cards are very simple - just the name
    // The quantity and basic stats are handled by BaseCard header
    return (
        <section className="ammo-content">
            <div className="ammo-card-name-display">
                {t(characterItem.id)}
            </div>
        </section>
    )
}

export default AmmoContent
