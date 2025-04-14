let display = undefined;

class Display {

        #capsDisplay;
        #weightDisplay;
        #hpDisplay;

        #defenseDisplay;
        #initiativeDisplay;
        #meleeDamageDisplay;

        #levelDisplay;

        #specialDisplays;
        #currentLuckDisplay;
        #skillDisplays;
        #specialtyDisplays;


        #characterBackgroundInput;
        #gameMapDisplay;

        #itemsDisplays;

        #elementMaps;


    constructor() {
        this.#defenseDisplay = document.getElementById('defense-value');
        this.#initiativeDisplay = document.getElementById('initiative-value');
        this.#meleeDamageDisplay = document.getElementById('melee-damage-value');

        this.#capsDisplay = document.getElementById('caps-value');
        this.#weightDisplay = document.getElementById('weight-value');
        this.#hpDisplay = document.getElementById('hp-value');

        this.#levelDisplay = document.getElementById('level-display');

        this.#specialDisplays = this.getDisplayMap(Character.getSpecialList(), "special-%s-value");
        this.#currentLuckDisplay = document.getElementById('luck-current-value');

        this.#skillDisplays = this.getDisplayMap(Character.getSkillList(), "skill-%s");
        this.#specialtyDisplays = this.getDisplayMap(Character.getSkillList(), "specialty-%s");

        this.#characterBackgroundInput = document.getElementById('character-background');
        this.#gameMapDisplay = document.getElementById('game-map');

        this.#itemsDisplays = this.getDisplayMap(
            [
                "smallGuns", "energyWeapons", "bigGuns", "meleeWeapons",
                "explosives", "throwing", "food", "drinks", "meds"
            ],
            "%s-cards"
        );

        this.#elementMaps = {};
        Object.keys(this.#itemsDisplays).forEach(key => {this.#elementMaps[key] = new Map()});

        this.#levelDisplay.addEventListener('change', () => {
            characterData.level = parseInt(this.#levelDisplay.value);
        })
        this.#currentLuckDisplay.parentElement.addEventListener('click', () => {
            if(!isEditing) {
                let replenishLuck = confirm("Vuoi davvero ripristinare la tua fortuna?")
                if(replenishLuck) {
                    characterData.currentLuck = characterData.getSpecial("luck");
                }
            }
        });
    }

    updateDefense(character) {
        this.#defenseDisplay.textContent = character.defense;
    }

    updateInitiative(character) {
        this.#initiativeDisplay.textContent = character.initiative;
    }

    updateMeleeDamage(character) {
        this.#meleeDamageDisplay.textContent = character.meleeDamage;
    }

    updateWeight(character) {
        this.#weightDisplay.textContent = character.currentWeight + "/" + character.maxWeight;
        this.#weightDisplay.style.color = character.currentWeight > character.maxWeight ? 'red' : "#afff03"; // TODO change color here if themes are implemented
    }

    updateHp(character){
        this.#hpDisplay.textContent = character.hpCurrent + "/" + character.calculateMaxHp();
    }

    updateCaps(character){
        this.#capsDisplay.textContent = character.caps;
    }

    updateLevel(character){
        this.#levelDisplay.textContent = character.level;
    }

    updateCurrentLuck(character){
        this.#currentLuckDisplay.textContent = character.currentLuck;
    }

    updateSpecial(special, character) {
        this.#specialDisplays[special].textContent = character.getSpecial(special);
    }

    updateSkill(skill, character) {
        this.#skillDisplays[skill].textContent = character.getSkill(skill);
    }

    updateSpecialty(skill, character) {
        this.#specialtyDisplays[skill].checked = character.hasSpecialty(skill);
    }

    updateItems(character) {

        requestAnimationFrame(() => {
            for (const type  of Object.keys(this.#elementMaps)) {
                const newIds = character.getItemsByType(type).map(item => item.id);
                const map = this.#elementMaps[type];
                const idsToRemove = new Set(map.keys()); // Track elements to remove.
                const containerElement = this.#itemsDisplays[type]

                newIds.forEach((id) => {
                    if (map.has(id)) {
                        // Element already exists.
                        idsToRemove.delete(id); // Keep it.
                    } else {
                        // Create and add the new element.
                        let newCard;
                        if(id.startsWith("weapon"))
                            newCard = createWeaponCard(id);
                        else
                            newCard = createObjectCard(id, type);
                        containerElement.appendChild(newCard);
                        map.set(id, newCard);
                    }
                });

                // Remove elements that are no longer in the list.
                idsToRemove.forEach((id) => {
                    const elementToRemove = map.get(id);
                    containerElement.removeChild(elementToRemove);
                    map.delete(id);
                });
            }
        });
    }

    getDisplayMap(list, format){
        return list.reduce((accumulator, listElement) => {
            accumulator[listElement] = document.getElementById(format.replace("%s", listElement));
            return accumulator
        }, {})
    }
}