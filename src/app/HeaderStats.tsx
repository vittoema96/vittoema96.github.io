import {useCharacter} from "@/contexts/CharacterContext.tsx";
import {usePopup} from "@/contexts/popup/PopupContext.tsx";
import IconTextPair from "@/components/IconTextPair.tsx";

export function HeaderStats() {
    const {character} = useCharacter()

    const {showStatAdjustmentPopup} = usePopup()

    return (
        <header className="l-lastSmall">
            <span className="h1">Pip-Boy 3000</span>
            <div id="c-headerStats"
                 onClick={showStatAdjustmentPopup}
                 style={{cursor: 'pointer'}}>
                <IconTextPair icon="hp" text={`${character.currentHp} / ${character.maxHp}`}/>
                <IconTextPair icon="caps" text={`${character.caps || 0}`}/>
                <IconTextPair icon="weight" text={`${character.currentWeight} / ${character.maxWeight}`}/>
            </div>
        </header>
    )
}

export default HeaderStats
