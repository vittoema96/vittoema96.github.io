import {useCharacter} from "@/contexts/CharacterContext";
import {usePopup} from "@/contexts/popup/PopupContext";
import IconTextPair from "@/components/IconTextPair";

export function HeaderStats() {
    const {character} = useCharacter()

    const {showStatAdjustmentPopup} = usePopup()

    // Effective max HP is reduced by rads
    const effectiveMaxHp = character.maxHp - character.rads
    const hasRads = character.rads > 0

    return (
        <header className="l-lastSmall">
            <span className="h1">Pip-Boy 3000</span>
            <div id="c-headerStats"
                 onClick={showStatAdjustmentPopup}
                 style={{cursor: 'pointer'}}>
                <div className="icon-text-pair">
                    <div className="themed-svg" data-icon="hp"></div>
                    <div>
                        {character.currentHp} / <span style={{padding: 0}} className={hasRads ? 'text-danger' : ''}>{effectiveMaxHp}</span>
                    </div>
                </div>
                <IconTextPair icon="caps" text={`${character.caps || 0}`}/>
                <IconTextPair icon="weight" text={`${character.currentWeight} / ${character.maxWeight}`}/>
            </div>
        </header>
    )
}

export default HeaderStats
