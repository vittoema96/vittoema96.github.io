import {useCharacter} from "@/contexts/CharacterContext";
import {usePopup} from "@/contexts/popup/PopupContext";
import IconTextPair from "@/components/IconTextPair";

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
