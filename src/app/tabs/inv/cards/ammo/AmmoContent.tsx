import { useTranslation } from 'react-i18next'
import { CharacterItem } from '@/types';

/**
 * Ammo-specific content renderer
 * Simple display for ammunition items
 */
interface AmmoContentProps{
    characterItem: CharacterItem
}
function AmmoContent({ characterItem }: Readonly<AmmoContentProps>) {
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
