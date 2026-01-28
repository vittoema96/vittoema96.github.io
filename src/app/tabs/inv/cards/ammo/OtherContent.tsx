import { useTranslation } from 'react-i18next'
import { CharacterItem } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';

/**
 * Ammo-specific content renderer
 * Simple display for ammunition items
 */
interface AmmoContentProps{
    characterItem: CharacterItem
}
function OtherContent({ characterItem }: Readonly<AmmoContentProps>) {
    const { t } = useTranslation()
    const dataManager = getGameDatabase()

    // Ammo cards are very simple - just the name
    // The quantity and basic stats are handled by BaseCard header
    const itemData = dataManager.getItem(characterItem.id)
    let description;
    if(itemData?.CATEGORY === "ammo"){
        const weapons = Object.values(dataManager.weapon).filter(w => w.AMMO_TYPE === itemData.ID)
        description = t("ammoUsedBy") + ":\n" + weapons.map(w => t(w.ID)).join(', ')
    } else {
        description = t(itemData?.ID+"Description")
    }
    return (
        <section className="card-description-overlay__content" style={{padding: "1rem"}}>
            <div className="card-description-overlay__text">
                <p>{description}</p>
            </div>
        </section>
    )
}

export default OtherContent
