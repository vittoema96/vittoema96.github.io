import { useTranslation } from 'react-i18next'
import { CharacterItem, CustomItem } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';


function OtherContent({ characterItem }: Readonly<{
    characterItem: CharacterItem | CustomItem;
}>) {
    const { t } = useTranslation()
    const dataManager = getGameDatabase()

    let itemData
    let description
    if("id" in characterItem) {
        itemData = dataManager.getItem(characterItem.id)
        description = t(characterItem.id+"Description")
    } else {
        itemData = characterItem
        description = characterItem.description ?? t('noDescription')
    }

    if (itemData?.TYPE === "ammo") {
        const weapons = Object.values(dataManager.weapon).filter(w => w.AMMO_TYPE === itemData.ID)
        description = t("ammoUsedBy") + ":\n" + weapons.map(w => t(w.ID)).join(', ')
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
