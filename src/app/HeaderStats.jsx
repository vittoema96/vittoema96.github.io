import React from 'react'

import {useCharacter} from "../contexts/CharacterContext.jsx";
import {usePopup} from "../contexts/PopupContext.jsx";
import IconTextPair from "../components/common/IconTextPair.jsx";

export function HeaderStats() {
    const {character, derivedStats} = useCharacter()
    // Get derived stats from context (already calculated)
    const {maxHp, maxWeight, currentWeight} = derivedStats

    const {showStatAdjustmentPopup} = usePopup()

    return (
        <header className="l-lastSmall">
            <span className="h1">Pip-Boy 3000</span>
            <div id="c-headerStats"
                 onClick={showStatAdjustmentPopup}
                 style={{cursor: 'pointer'}}>
                <IconTextPair icon="hp" text={`${character.currentHp} / ${maxHp}`}/>
                <IconTextPair icon="caps" text={character.caps || 0}/>
                <IconTextPair icon="weight" text={`${currentWeight} / ${maxWeight}`}/>
            </div>
        </header>
    )
}

export default HeaderStats