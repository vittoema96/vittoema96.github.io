import React from 'react'
import { useI18n } from '../../../hooks/useI18n.js'

/**
 * Ammo-specific content renderer
 * Simple display for ammunition items
 */
function AmmoContent({ itemData }) {
    const t = useI18n()

    // Ammo cards are very simple - just the name
    // The quantity and basic stats are handled by BaseCard header
    return (
        <section className="ammo-content">
            <div className="ammo-card-name-display">
                {t(itemData.ID)}
            </div>
        </section>
    )
}

export default AmmoContent