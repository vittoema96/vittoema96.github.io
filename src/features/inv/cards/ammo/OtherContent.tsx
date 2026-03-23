import { useTranslation } from 'react-i18next'
import { CharacterItem, CustomItem } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';

/**
 * Other items content renderer
 * Handles both database items (ammo, misc) and custom items
 */
interface OtherContentProps {
    characterItem?: CharacterItem;
    customItem?: CustomItem;
}

function OtherContent({ characterItem, customItem }: Readonly<OtherContentProps>) {
    const { t } = useTranslation()
    const dataManager = getGameDatabase()

    let description: string;

    // Handle custom items (separate list)
    if (customItem) {
        description = customItem.description || t('noDescription')
    }
    // Handle database items
    else if (characterItem) {
        const itemData = dataManager.getItem(characterItem.id)

        if (itemData?.TYPE === "ammo") {
            const weapons = Object.values(dataManager.weapon).filter(w => w.AMMO_TYPE === itemData.ID)
            description = t("ammoUsedBy") + ":\n" + weapons.map(w => t(w.ID)).join(', ')
        } else {
            description = t(itemData?.ID + "Description")
        }
    } else {
        description = t('noDescription')
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
