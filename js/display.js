let display = undefined;
let mainDisplay = undefined;

class Display {
    #longPressTimer = null;
    #longPressTarget = null;

    constructor() {
        // Cache all DOM elements once
        this.dom = {
            itemContainers: this.getDisplayMap(["smallGuns", "energyWeapons", "bigGuns", "meleeWeapons", "explosives", "throwing", "unarmed", "food", "drinks", "meds", "ammo"], "%s-cards"),

            invScreen: document.getElementById('inv-tabContent')
        };
        this.elementMaps = {};
        Object.keys(this.dom.itemContainers).forEach(key => { this.elementMaps[key] = new Map() });
        this.addEventListeners();
    }

    // Called once after characterData is loaded
    initialize(character) {
        this.fullUpdate(character);
    }

    fullUpdate(character) {
        this.updateItems(character);
    }

    addEventListeners() {
        // --- Event Delegation for Inventory Cards ---
        this.dom.invScreen.addEventListener('click', (e) => this.handleCardClick(e));
        this.dom.invScreen.addEventListener('pointerdown', (e) => this.handleCardPointerDown(e));
        this.dom.invScreen.addEventListener('pointerup', () => this.clearLongPressTimer());
        this.dom.invScreen.addEventListener('pointerleave', () => this.clearLongPressTimer());
    }

    handleCardClick(e) {
        const action = e.target.closest('[data-action]')?.dataset?.action;
        if (!action) return;

        const cardDiv = e.target.closest('.card,.ammo-card');
        if (!cardDiv) return;

        const { itemId, itemType } = cardDiv.dataset;

        switch (action) {
            case 'toggle-description': {
                const container = cardDiv.querySelector(".description-container");
                const button = cardDiv.querySelector(".description-toggle-button");
                container.classList.toggle("expanded");
                const langId = container.classList.contains("expanded") ? "close" : "showDescription";
                button.dataset.langId = langId;
                button.textContent = translator.translate(langId);
                break;
            }
            case 'attack': {
                const { skill, objectId } = e.target.dataset;
                const ammo = dataManager.getItem(objectId).AMMO_TYPE;
                if(!isMelee(skill) && characterData.getItemQuantity(ammo) <= 0){
                    alertPopup("notEnoughAmmoAlert");
                } else {
                    openD20Popup(skill, objectId);
                }
                break;
            }
            case 'delete':
                characterData.removeItem(itemId);
                break;
            case 'sell': // TODO: Implement sell logic
                openSellItemPopup(itemId);
            case 'cancel-overlay':
                cardDiv.querySelector('.card-overlay').classList.add('hidden');
                break;
        }
    }

    handleCardPointerDown(e) {
        this.clearLongPressTimer();
        const cardDiv = e.target.closest('.card,.ammo-card')
        if (cardDiv && !dataManager.isUnacquirable(cardDiv.dataset.itemId)) {
            this.#longPressTarget = cardDiv;
            this.#longPressTimer = setTimeout(() => {
                const overlay = this.#longPressTarget.querySelector('.card-overlay');
                if (overlay) overlay.classList.remove('hidden');
            }, 500);
        }
    }

    clearLongPressTimer() {
        clearTimeout(this.#longPressTimer);
        this.#longPressTimer = null;
        this.#longPressTarget = null;
    }

    updateItems(character) {
        requestAnimationFrame(() => {
            for (const type of Object.keys(this.elementMaps)) {
                const itemsOfType = character.getItemsByType(type);
                if(type === SKILLS.UNARMED){ // TODO divide unarmed and melee and make unarmedStrike fixed
                    itemsOfType.push({id: "weaponUnarmedStrike", type: type, quantity: 1});
                } else if(type === SKILLS.MELEE_WEAPONS){
                    character.getGunBashItems().forEach(gunBashItem =>
                        itemsOfType.push(gunBashItem)
                    )
                }
                const container = this.dom.itemContainers[type];
                const currentMap = this.elementMaps[type];
                const newIdSet = new Set(itemsOfType.map(item => item.id));

                // Remove cards that are no longer in the character's inventory
                for (const id of currentMap.keys()) {
                    if (!newIdSet.has(id)) {
                        const elementToRemove = currentMap.get(id);
                        container.removeChild(elementToRemove);
                        currentMap.delete(id);
                    }
                }

                // Add or update cards
                itemsOfType.forEach(item => {
                    if (!currentMap.has(item.id)) {
                        let newCard;
                        if (Object.values(SKILLS).includes(item.type))
                            newCard = createWeaponCard(item.id, item.quantity);
                        else if (item.type === "ammo")
                            newCard = createAmmoEntry(item.id, item.quantity);
                        else
                            newCard = createObjectCard(item.id, item.type, item.quantity);

                        if (newCard) {
                            container.appendChild(newCard);
                            currentMap.set(item.id, newCard);
                        }
                    } else {
                        const itemCard = currentMap.get(item.id);
                        itemCard.querySelector(".card-quantity").textContent = `${item.quantity}x`;
                        const ammoCount = itemCard.querySelector(".js-cardWeapon-ammoCount");
                        if(ammoCount) {
                            ammoCount.textContent = characterData.getItemQuantity(dataManager.getItem(item.id).AMMO_TYPE).toString();
                        }
                    }
                    // TODO: Handle multiple items with different mods
                });

            }
            translator.loadTranslations();
        });
    }

    getDisplayMap(list, format) {
        return list.reduce((acc, el) => {
            acc[el] = document.getElementById(format.replace("%s", el));
            return acc;
        }, {});
    }
}

function getDisplayMap(list, format) {
    return list.reduce((acc, el) => {
        acc[el] = document.getElementById(format.replace("%s", el));
        return acc;
    }, {});
}

class DisplayInterface {
    _dom;

    #onChange(changeType, element, value, callback){
        if(typeof changeType === "string"){
            changeType = [changeType];
        }
        for(const type of changeType) {
            characterData.addEventListener(`change:${type}`, (e) => {
                element[value] = callback ? callback(e) : e.detail;
            })
        }
    }


    onChangeSetText(changeType, element, valueCallback = null){
        this.#onChange(changeType, element, "textContent", valueCallback);
    }

    onChangeSetValue(changeType, element, valueCallback = null){
        this.#onChange(changeType, element, "value", valueCallback);
    }

    onChangeSetChecked(changeType, element, valueCallback = null){
        this.#onChange(changeType, element, "checked", valueCallback);
    }
}

class MainDisplay extends DisplayInterface {

    #statDisplay;
    #invDisplay;
    #dataDisplay;
    #mapDisplay;

    constructor() {
        super();
        this._dom = {
            hp: document.getElementById('c-headerStats__hp'),
            caps: document.getElementById('c-headerStats__caps'),
            weight: document.getElementById('c-headerStats__weight'),

            tabButtons: document.querySelectorAll(".tab-button")
        }

        this.#statDisplay = new StatDisplay();
        this.#invDisplay = new InvDisplay();
        this.#dataDisplay = new DataDisplay();
        this.#mapDisplay = new MapDisplay();

        this.onChangeSetText(["currentHp", "level", SPECIAL.ENDURANCE, SPECIAL.LUCK], this._dom.hp, () => {
            return `${characterData.currentHp}/${characterData.maxHp}`
        });
        this.onChangeSetText("caps", this._dom.caps);
        this.onChangeSetText(["items", "strength"], this._dom.weight, () => this.#updateWeight());
    }

    #updateWeight(){
        this._dom.weight.style.color = characterData.currentWeight > characterData.maxWeight ? 'red' : 'var(--primary-color)';
        return `${characterData.currentWeight.toFixed(1)}/${characterData.maxWeight}`;
    }


}

class StatDisplay extends DisplayInterface {

    #isEditing = false;

    constructor() {
        super();
        this._dom = {
            specials: getDisplayMap(Object.values(SPECIAL), "special__value-%s"),
            currentLuck: document.getElementById('luck-current-value'),

            defense: document.getElementById('defense-value'),
            initiative: document.getElementById('initiative-value'),
            meleeDamage: document.getElementById('melee-damage-value'),

            skills: getDisplayMap(Object.values(SKILLS), "skill-%s"),
            specialties: getDisplayMap(Object.values(SKILLS), "specialty-%s"),

            editStatsButton: document.getElementById('edit-stats-button'),
        }

        Object.values(SPECIAL).forEach(special => this.onChangeSetText(special, this._dom.specials[special]));
        this.onChangeSetText("currentLuck", this._dom.currentLuck);
        this._dom.currentLuck.parentElement.addEventListener('click', () => {
            if(!this.#isEditing){
                confirmPopup("replenishLuckAlert", () => {
                    characterData.currentLuck = characterData.getSpecial(SPECIAL.LUCK);
                })
            }
        });

        this.onChangeSetText(SPECIAL.AGILITY, this._dom.defense, () => characterData.defense);
        this.onChangeSetText([SPECIAL.AGILITY,SPECIAL.PERCEPTION], this._dom.initiative, () => characterData.initiative);
        this.onChangeSetText(SPECIAL.STRENGTH, this._dom.meleeDamage, () => `+${characterData.meleeDamage}`);

        Object.values(SKILLS).forEach(skill => {
            this.onChangeSetText(skill, this._dom.skills[skill]);
        });

        this._dom.editStatsButton.addEventListener('click', () => this.#toggleEditMode());
        Object.values(SPECIAL).forEach(special => this._dom.specials[special].closest('.special')?.addEventListener('click', (e) => this.#handleSpecialClick(e)));
        Object.values(SKILLS).forEach(skill => this._dom.skills[skill].closest('.skill')?.addEventListener('click', (e) => this.#handleSkillClick(e)));

    }

    #toggleEditMode() {
        this.#isEditing = !this.#isEditing;
        Object.values(mainDisplay._dom.tabButtons).forEach(el => el.disabled = this.#isEditing);
        Object.values(this._dom.specialties).forEach(cb => cb.disabled = !this.#isEditing);
        this._dom.editStatsButton.textContent = this.#isEditing ? 'Stop Editing' : 'Edit Stats'; // TODO language
    }

    #handleSpecialClick(event) {
        if (!this.#isEditing) return;
        const specialDiv = event.target.closest('.special');
        const special = specialDiv.dataset.special;
        const max = (special === SPECIAL.STRENGTH || special === SPECIAL.ENDURANCE) ? 12 : 10;
        const current = characterData.getSpecial(special);
        const next = current < max ? current + 1 : 4;
        characterData.setSpecial(special, next);
        if (special === SPECIAL.LUCK) characterData.currentLuck = next; // Better handling, maybe apply the difference
    }

    #handleSkillClick(event) {
        const skillDiv = event.target.closest('.skill');
        const skillName = skillDiv.dataset.skill;

        if (this.#isEditing) {
            const checkbox = skillDiv.querySelector('input');
            if (event.target === checkbox) {
                characterData.toggleSpecialty(skillName);
            } else {
                const current = characterData.getSkill(skillName);
                const next = current < 6 ? current + 1 : (checkbox && checkbox.checked ? 2 : 0);
                characterData.setSkill(skillName, next);
            }
        } else {
            openD20Popup(skillName);
        }
    }

}

class InvDisplay {

    constructor() {
        this._dom = {
            itemContainers: getDisplayMap(["smallGuns", "energyWeapons", "bigGuns", "meleeWeapons", "explosives", "throwing", "unarmed", "food", "drinks", "meds", "ammo"], "%s-cards"),
        }
    }

}

class DataDisplay extends DisplayInterface {

    constructor() {
        super();
        this._dom = {
            level: document.getElementById('level'),
        }

        this.onChangeSetText("level", this._dom.level);

        this._dom.level.addEventListener('change', (e) => {
            e = Number(e.target.value);
            if(!e) return;
            characterData.level = e;
        });
    }

}

class MapDisplay {

    constructor() {
        this._dom = {

        }
    }

}
