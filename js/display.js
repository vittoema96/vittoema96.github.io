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

        #isEditing;

        #editStatsButton;
        #skillBoxes;


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
        this.#skillBoxes = document.querySelectorAll('.skill');

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
        this.#editStatsButton = document.getElementById('edit-stats-button');


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
        this.#editStatsButton.addEventListener('click', () => this.toggleEditMode());
        this.#skillBoxes.forEach(box => {
            box.addEventListener('click',  (evt) => {
                if(this.#isEditing)
                    this.incrementSkill(evt);
                else {
                    const box = evt.currentTarget;
                    const skillId = box.querySelector('.skill-value').id.replace("skill-", "");
                    openDicePopup(skillId);
                }
            });
        });
        const specialStatBoxes = document.querySelectorAll('.stat');
        specialStatBoxes.forEach(box => {
            box.addEventListener('click', (evt) => this.incrementSpecialStat(evt));
        });


        this.#isEditing = false;
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

    toggleEditMode() {
        this.#isEditing = !this.#isEditing;
        let isEditing = this.#isEditing;

        // TODO should probably not set editing, but still the "effect" when gear is clicked is cool
        Character.getSpecialList().forEach(special =>
            this.#specialDisplays[special].contentEditable = isEditing
        )



        // TODO as above, but here i did not leave the contentEditable = true (as i don't remember any "effect" here)

        // Toggle event listeners on skills
        const skillBoxes = document.querySelectorAll('.skill'); // Or whatever the parent element is
        skillBoxes.forEach(box => {
            const checkbox = box.querySelector('input[type="checkbox"][class="specialty-checkbox"]');
            if(checkbox)
                checkbox.disabled = !isEditing;
        });

        // Update button text
        this.#editStatsButton.textContent = isEditing ? 'Save Stats' : 'Edit Stats'; // TODO Translation
    }

    incrementSpecialStat(event) {
        if (!this.#isEditing) return; // Only increment if editing

        const clickedSpecial = event.currentTarget;
        const special = clickedSpecial.dataset.special;

        const maxValue = special === "strength" || special === "endurance" ? 12 : 10;
        const currentValue = characterData.getSpecial(special);
        const newValue = currentValue < maxValue ? currentValue + 1 : 4;
        characterData.setSpecial(special, newValue);
        if(special === "luck")
            characterData.currentLuck = newValue;
    }

    incrementSkill(event) {
        if (!this.#isEditing) return; // Only increment if editing

        const box = event.currentTarget;
        const skillName = box.dataset.skill;

        const checkboxId = `specialty-${skillName}`;
        const checkbox = box.querySelector(`input[type="checkbox"][id="${checkboxId}"]`);

        // Check if the click originated from the checkbox
        if (event.target === checkbox) {
            if (checkbox.checked && !characterData.hasSpecialty(skillName))
                characterData.addSpecialty(skillName);
            else if (!checkbox.checked && characterData.hasSpecialty(skillName))
                characterData.removeSpecialty(skillName);

        } else {
            const currentValue = characterData.getSkill(skillName);
            const newValue = currentValue < 6 ? currentValue + 1
                : checkbox && checkbox.checked ? 2 : 0;
            characterData.setSkill(skillName, newValue);

        }
    }

    getDisplayMap(list, format){
        return list.reduce((accumulator, listElement) => {
            accumulator[listElement] = document.getElementById(format.replace("%s", listElement));
            return accumulator
        }, {})
    }
}