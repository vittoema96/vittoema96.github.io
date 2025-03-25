let display = undefined;

class Display {
    #isEditing = false;
    #longPressTimer = null;
    #longPressTarget = null;

    constructor() {
        // Cache all DOM elements once
        this.dom = {
            defense: document.getElementById('defense-value'),
            initiative: document.getElementById('initiative-value'),
            meleeDamage: document.getElementById('melee-damage-value'),

            caps: document.getElementById('caps-value'),
            weight: document.getElementById('weight-value'),
            hp: document.getElementById('hp-value'),

            level: document.getElementById('level-display'),

            currentLuck: document.getElementById('luck-current-value'),
            specials: this.getDisplayMap(Character.getSpecialList(), "special-%s-value"),

            skills: this.getDisplayMap(Character.getSkillList(), "skill-%s"),
            specialties: this.getDisplayMap(Character.getSkillList(), "specialty-%s"),
            itemContainers: this.getDisplayMap(["smallGuns", "energyWeapons", "bigGuns", "meleeWeapons", "explosives", "throwing", "unarmed", "food", "drinks", "meds", "ammo"], "%s-cards"),

            editStatsButton: document.getElementById('edit-stats-button'),
            statContainer: document.getElementById('stat-container'),
            skillsContainer: document.getElementById('skills'),
            invScreen: document.getElementById('inv-screen'),
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
        this.updateDefense(character);
        this.updateInitiative(character);
        this.updateMeleeDamage(character);
        this.updateWeight(character);
        this.updateHp(character);
        this.updateCaps(character);
        this.updateLevel(character);
        this.updateCurrentLuck(character);
        Character.getSpecialList().forEach(s => this.updateSpecial(s, character));
        Character.getSkillList().forEach(s => {
            this.updateSkill(s, character);
            this.updateSpecialty(s, character);
        });
        this.updateItems(character);
        this.updateLanguage(character);
    }

    addEventListeners() {
        this.dom.level.addEventListener('change', () => {
            characterData.level = this.dom.level.value;
        });
        this.dom.currentLuck.parentElement.addEventListener('click', () => {
            if (!this.#isEditing && confirm("Vuoi davvero ripristinare la tua fortuna?")) {
                characterData.currentLuck = characterData.getSpecial(SPECIAL.LUCK);
            }
        });
        this.dom.editStatsButton.addEventListener('click', () => this.toggleEditMode());
        this.dom.statContainer.addEventListener('click', (e) => this.handleStatClick(e));
        this.dom.skillsContainer.addEventListener('click', (e) => this.handleSkillClick(e));

        // --- Event Delegation for Inventory Cards ---
        this.dom.invScreen.addEventListener('click', (e) => this.handleCardClick(e));
        this.dom.invScreen.addEventListener('pointerdown', (e) => this.handleCardPointerDown(e));
        this.dom.invScreen.addEventListener('pointerup', (e) => this.clearLongPressTimer());
        this.dom.invScreen.addEventListener('pointerleave', (e) => this.clearLongPressTimer());
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
                button.textContent = translate(langId);
                break;
            }
            case 'attack': {
                const { skill, objectId } = e.target.dataset;
                const ammo = getItem(objectId).AMMO_TYPE;
                if(!isMelee(skill) && characterData.getItemQuantity(ammo) <= 0){
                    showNotification("Non hai abbastanza muniz. per farlo!") // TODO language
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
        if (cardDiv) {
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

    updateDefense(c) { this.dom.defense.textContent = c.defense; }
    updateInitiative(c) { this.dom.initiative.textContent = c.initiative; }
    updateMeleeDamage(c) { this.dom.meleeDamage.textContent = `+${c.meleeDamage}`; }
    updateWeight(c) {
        this.dom.weight.textContent = `${c.currentWeight.toFixed(1)}/${c.maxWeight}`;
        this.dom.weight.style.color = c.currentWeight > c.maxWeight ? 'red' : 'var(--primary-color)';
    }
    updateHp(c){ this.dom.hp.textContent = `${c.currentHp}/${c.calculateMaxHp()}`; }
    updateCaps(c){ this.dom.caps.textContent = c.caps; }
    updateLevel(c){ this.dom.level.value = c.level; }
    updateCurrentLuck(c){ this.dom.currentLuck.textContent = c.currentLuck; }
    updateSpecial(s, c) { this.dom.specials[s].textContent = c.getSpecial(s); }
    updateSkill(s, c) { this.dom.skills[s].textContent = c.getSkill(s); }
    updateSpecialty(s, c) { this.dom.specialties[s].checked = c.hasSpecialty(s); }

    updateItems(character) {
        requestAnimationFrame(() => {
            for (const type of Object.keys(this.elementMaps)) {
                let itemsOfType;
                if(type === SPECIAL.UNARMED){ // TODO divide unarmed and melee and make unarmedStrike fixed
                    itemsOfType = [{id: "weaponUnarmedStrike", type: type, quantity: 1}]
                } else {
                    itemsOfType = character.getItemsByType(type);
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
                        if (Character.getSkillList().includes(item.type))
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
                        const ammoCount = itemCard.querySelector("#weaponAmmoCount");
                        if(ammoCount) {
                            ammoCount.textContent = characterData.getItemQuantity(getItem(item.id).AMMO_TYPE).toString();
                        }
                    }
                    // TODO: Handle multiple items with different mods
                });

            }
            loadTranslations();
        });
    }

    updateLanguage(character){
        // TODO implement
    }

    toggleEditMode() {
        this.#isEditing = !this.#isEditing;
        Object.values(this.dom.specials).forEach(el => el.contentEditable = this.#isEditing);
        Object.values(this.dom.specialties).forEach(cb => cb.disabled = !this.#isEditing);
        this.dom.editStatsButton.textContent = this.#isEditing ? 'Stop Editing' : 'Edit Stats';
    }

    handleStatClick(event) {
        if (!this.#isEditing) return;
        const statDiv = event.target.closest('.stat');
        if (!statDiv) return;
        const special = statDiv.dataset.special;
        const max = (special === SPECIAL.STRENGTH || special === SPECIAL.ENDURANCE) ? 12 : 10;
        const current = characterData.getSpecial(special);
        const next = current < max ? current + 1 : 4;
        characterData.setSpecial(special, next);
        if (special === SPECIAL.LUCK) characterData.currentLuck = next; // Better handling, maybe apply the difference
    }

    handleSkillClick(event) {
        const skillDiv = event.target.closest('.skill');
        if (!skillDiv) return;
        const skillName = skillDiv.dataset.skill;

        if (this.#isEditing) {
            const checkbox = skillDiv.querySelector('input');
            if (event.target === checkbox) {
                if (checkbox.checked) characterData.addSpecialty(skillName);
                else characterData.removeSpecialty(skillName);
            } else {
                const current = characterData.getSkill(skillName);
                const next = current < 6 ? current + 1 : (checkbox && checkbox.checked ? 2 : 0);
                characterData.setSkill(skillName, next);
            }
        } else {
            openD20Popup(skillName);
        }
    }

    getDisplayMap(list, format) {
        return list.reduce((acc, el) => {
            acc[el] = document.getElementById(format.replace("%s", el));
            return acc;
        }, {});
    }
}