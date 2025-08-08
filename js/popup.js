class D20Popup {

    static #htmlElement = document.getElementById('d20-popup');
    static #dom = {
        skillTitle: document.getElementById('d20-popup-skill-title'),

        specialSelector: document.getElementById('d20-popup-special-selector'),
        luckCheckbox: document.getElementById('d20-popup-luck-checkbox'),

        targetNumber: document.getElementById('d20-popup-target'),
        targetNumberBreakdown: document.getElementById('d20-popup-target-breakdown'),
        critBreakdown: document.getElementById('d20-popup-crit-breakdown'),

        dice: this.#htmlElement.querySelectorAll('.d20-dice'),

        apCost: document.getElementById('d20-popup-ap-cost'),
        aimCheckbox: document.getElementById('d20-popup-aim-checkbox'),
        payedLuck: document.getElementById('d20-popup-payed-luck'),
        luckCost: document.getElementById('d20-popup-luck-cost'),

        successesDisplay: document.getElementById('d20-popup-successes-display'),

        rollButton: document.getElementById('d20-popup-roll-button'),
        damageButton: document.getElementById('d20-popup-damage-button'),
    };

    constructor() {
        D20Popup.#dom.specialSelector.addEventListener('change', (event) => {
            this.#specialId = event.target.value;
            this.#render();
        });
        D20Popup.#dom.luckCheckbox.addEventListener('change', (event) => {
            this.#isUsingLuck = event.target.checked;
            this.#render();
        });
        D20Popup.#dom.dice.forEach((dice, index) => {
            dice.addEventListener('click', () => {
                this.#onDiceClick(index);
                this.#render();
            });
        });
        D20Popup.#dom.aimCheckbox.addEventListener('change', (event) => {
            this.#isAiming = event.target.checked;
            this.#render();
        });
        D20Popup.#dom.damageButton.addEventListener('click', () => {
            closeActivePopup(); // FIXME
            openD6Popup(this.#objectId);
        });
        D20Popup.#dom.rollButton.addEventListener('click', () => {
            this.#handleRoll();
            this.#render();
        });
    }

    #character;

    #objectId;
    #hasRolled;
    #skillId;
    #specialId;
    #isUsingLuck ;
    #isAiming ;

    #diceContent;
    #diceActive;
    #diceRerolled;

    open(skillId, objectId){
        this.#initialize(skillId, objectId);
        this.#render();
        D20Popup.#htmlElement.showModal();
    }

    #initialize(skillId, objectId){
        this.#character = characterData;

        this.#objectId = objectId;
        this.#hasRolled = false;
        this.#skillId = skillId;
        this.#specialId = Character.getSpecialFromSkill(skillId);
        this.#isUsingLuck = false;
        this.#isAiming = false;

        this.#diceContent = Array(5).fill('?');
        this.#diceActive = [true, true, false, false, false];
        this.#diceRerolled = Array(5).fill(false);
    }

    #render() {
        D20Popup.#dom.skillTitle.textContent = translate(this.#skillId);

        const activeSpecialId = this.#isUsingLuck ? 'luck' : this.#specialId;
        D20Popup.#dom.specialSelector.value = activeSpecialId;
        // TODO add specialSelector.textContent = translate ???
        D20Popup.#dom.specialSelector.disabled = this.#hasRolled || this.#isUsingLuck;

        D20Popup.#dom.luckCheckbox.checked = this.#isUsingLuck;
        D20Popup.#dom.luckCheckbox.disabled = this.#hasRolled;

        const skillVal = this.#character.getSkill(this.#skillId);
        const specialVal = this.#character.getSpecial(activeSpecialId);
        const targetVal = skillVal + specialVal;
        const isSpecialty = this.#character.hasSpecialty(this.#skillId);
        const critVal = isSpecialty ? skillVal : 1;
        // TODO language (Target, Skill, Critical Hit, etc...)
        D20Popup.#dom.targetNumber.textContent = `Target: ${targetVal}`;
        D20Popup.#dom.targetNumberBreakdown.textContent = `${skillVal} (Skill) + ${specialVal} (SPECIAL)`;
        D20Popup.#dom.critBreakdown.textContent = `Critical Hit: Roll ${critVal > 1 ? `≤` : `=`}${critVal}`;

        D20Popup.#dom.dice.forEach((dice, index) => {
            dice.textContent = this.#hasRolled ? this.#diceContent[index] : "?";
            dice.classList.toggle('active', this.#diceActive[index]);
            dice.classList.toggle('rerolled', this.#diceRerolled[index]);
            // '?' <= x and '?' >= x are always false.
            dice.classList.toggle('roll-crit', this.#diceContent[index] <= critVal);
            dice.classList.toggle('roll-complication', this.#diceContent[index] >= 20); // TODO complications < 20
        });

        // Don't update after rolling!
        if(!this.#hasRolled) {
            D20Popup.#dom.apCost.textContent = this.#getApCost().toString();
        }
        D20Popup.#dom.aimCheckbox.checked = this.#isAiming;
        D20Popup.#dom.aimCheckbox.disabled = this.#hasRolled;

        D20Popup.#dom.payedLuck.textContent = this.#getPayedLuck().toString();
        D20Popup.#dom.luckCost.textContent = `(${this.#getLuckCost()})`;
        
        let successes = '?';
        if(this.#hasRolled){
            successes = 0;
            this.#diceContent.forEach(roll => {
                const rollValue = Number(roll);
                if (!isNaN(rollValue)) {
                    if (rollValue <= critVal) successes += 2;
                    else if (rollValue <= targetVal) successes++;
                }
            });
        }
        D20Popup.#dom.successesDisplay.textContent = `${translate("successes")}: ${successes}`;

        if(this.#objectId){
            D20Popup.#dom.damageButton.style.display = 'block';
            D20Popup.#dom.damageButton.disabled = this.#hasRolled;
        } else {
            D20Popup.#dom.damageButton.style.display = 'none';
        }
        if(!this.#hasRolled){
            D20Popup.#dom.rollButton.textContent = spacedTranslate("roll", "reroll");
        } else {
            D20Popup.#dom.rollButton.textContent = spacedTranslate("reroll", "roll");
        }
    }

    #onDiceClick(index){
        if (!this.#hasRolled) {
            const activeDice = Math.max(2, index + 1)
            this.#diceActive = [false, false, false, false, false];
            this.#diceActive.fill(true, 0, activeDice);
        } else if(this.#diceContent[index] !== '?' && !this.#diceRerolled[index]){
            this.#diceActive[index] = !this.#diceActive[index];
        }
    }

    #handleRoll(){

        if (this.#getActiveDiceCount() === 0) {
            return showNotification("Seleziona dei dadi da (ri)lanciare!"); // TODO Language
        }

        let luckCost = this.#getLuckCost();
        luckCost = luckCost > 0 ? luckCost : 0;
        if (this.#character.currentLuck < luckCost) {
            return showNotification("Non hai abbastanza Fortuna per farlo!"); // TODO Language
        }

        this.#character.currentLuck -= luckCost;

        this.#getActiveDice().forEach((dice, index) => {
            this.#diceContent[index] = Math.floor(Math.random() * 20) + 1
            this.#diceActive = Array(5).fill(false);
            if(this.#hasRolled){
                this.#diceRerolled[index] = true;
            }
        });
        // !IMPORTANT, DON'T MOVE!
        // This is used above, keep it here
        this.#hasRolled = true;
    }

    #getActiveDice(){
        return this.#diceActive.filter(Boolean);
    }

    #getActiveDiceCount(){
        return this.#getActiveDice().length;
    }

    #getRerolledDiceCount(){
        return this.#diceRerolled.filter(Boolean).length;
    }

    #getApCost(){
        switch (this.#getActiveDiceCount()) {
            case 5: return 6;
            case 4: return 3;
            case 3: return 1;
            default: return 0;
        }
    }

    #getLuckCost(){
        let luckCost;
        if(!this.#hasRolled){
            luckCost = this.#isUsingLuck-this.#isAiming;
        } else {
            const rerollingCount = this.#getActiveDiceCount();
            const rerolledCount = this.#getRerolledDiceCount();
            const alreadyPayed = this.#isUsingLuck - this.#isAiming + rerolledCount;
            luckCost = rerollingCount + (alreadyPayed < 0 ? -1 : 0); // Was aiming already used?
        }
        return luckCost;
    }

    #getPayedLuck(){
        let payedLuck = 0;
        if(this.#hasRolled){
            const rerolledCount = this.#getRerolledDiceCount();
            payedLuck = this.#isUsingLuck - this.#isAiming + rerolledCount;
        }
        return payedLuck > 0 ? payedLuck : 0;
    }
}




// Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {

    /**
     * Shows a custom notification message. Replaces alert().
     * @param {string} message The message to display.
     */
    window.showNotification = (message) => {
        // TODO This is a placeholder for custom notification logic.
        console.warn("Notification:", message); // For now, we log to the console.
        // Example:
        // const notificationText = popups.notification.querySelector('.message');
        // notificationText.textContent = message;
        // popups.notification.showModal();
        alert(message); // Reverted to alert for now so you can see it working.
    }
    // TODO might have a better way, might conflict with multiple dialogs + tooltips etc
    window.closeActivePopup = () => {
        const activeDialog = document.querySelector('dialog[open]');
        if (activeDialog) {
            activeDialog.addEventListener('animationend', () => {
                activeDialog.close();
                activeDialog.classList.remove('dialog-closing');
            }, { once: true });
            activeDialog.classList.add('dialog-closing');
        }
    }

    // Close buttons for all popups
    document.querySelectorAll('.popup-close-button, dialog .cancel-button').forEach(btn => {
        btn.addEventListener('click', closeActivePopup);
    });

    const d20Popup = new D20Popup();
    window.openD20Popup = (skillId, objectId) => {
        d20Popup.open(skillId, objectId);
    };

    // TODO To refactor
    const popups = {
        d6: document.getElementById('d6-popup'),
        addItem: document.getElementById('add-item-popup'),
        // It's good practice to add a dedicated notification popup instead of using alert() TODO
        notification: document.getElementById('notification-popup')
    };

    const d6PopupElements = {
        popup: popups.d6,
        weaponName: document.getElementById('d6-weapon-name'),
        damageType: document.getElementById('d6-damage-type'),
        tagsContainer: document.getElementById('d6-tags'),
        damageDiceContainer: document.getElementById('d6-damage-dice-container'),
        extraHitsTitle: document.getElementById('d6-extra-hits-title'),
        extraHitsContainer: document.getElementById('d6-extra-hits-container'),
        totalDamage: document.getElementById('d6-total-damage'),
        totalEffects: document.getElementById('d6-total-effects'),
        rollButton: document.getElementById('d6-roll-button')
    };

    let d6RollState = {};

    window.openD6Popup = (weaponId) => {
        if (!weaponData[weaponId]) {
            return showNotification(`Arma non trovata: ${weaponId}`);
        }
        resetD6RollState(weaponId);
        updateD6PopupUI();
        popups.d6.showModal();
    };

    d6PopupElements.rollButton.addEventListener('click', handleD6Roll);

    /**
     * Resets the dice roll state to its default values.
     * @param {string} weaponId Id of the weapon used
     */
    function resetD6RollState(weaponId) {
        d6RollState = {
            weaponId: weaponId,
            hasRolled: false,
        };
    }


    /**
     * Updates all displays in the d6 popup based on the current d6RollState.
     */
    function updateD6PopupUI() {
        const weapon = weaponData[d6RollState.weaponId];
        if (!weapon) {
            alert("Trying to attack with a non-weapon object.")
            return;
        }

        // Stuff that don't change after Dice are rolled (and d6 need to be kept for the classes)
        if(!d6RollState.hasRolled) {
            d6PopupElements.damageDiceContainer.innerHTML = '';
            d6PopupElements.extraHitsContainer.innerHTML = '';
            d6PopupElements.tagsContainer.innerHTML = '';

            // Imposta testi e tag
            d6PopupElements.weaponName.textContent = translate(weapon.ID);
            d6PopupElements.damageType.textContent = weapon.DAMAGE_TYPE; // TODO Handle language

            weapon.EFFECTS.split(',').map(e => e.trim()).filter(e => e).forEach(effect => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = effect;
                d6PopupElements.tagsContainer.appendChild(tag);
            }); // TODO Handle language

            // Crea i dadi per il danno
            let createD6Div = (index, isExtra) => {
                const diceDiv = document.createElement('div');
                diceDiv.className = 'd6-dice';
                diceDiv.textContent = '?';
                diceDiv.classList.toggle('active', !isExtra)
                diceDiv.addEventListener('click', () => handleD6Click(diceDiv, index))
                return diceDiv
            }

            for (let i = 0; i < weapon.DAMAGE_RATING; i++) {
                const diceDiv = createD6Div(i, false);
                d6PopupElements.damageDiceContainer.appendChild(diceDiv);
            }

            // Gestisce i colpi extra
            const fireRate = weapon.FIRE_RATE;
            if (fireRate === '-') {
                d6PopupElements.extraHitsTitle.textContent = "Colpi Extra (AP)";
                d6PopupElements.extraHitsContainer.style.display = 'flex';
                for (let i = 0; i < 3; i++) { // 3 dadi fissi se il fire rate è '-'
                    const diceDiv = createD6Div(i, true);
                    d6PopupElements.extraHitsContainer.appendChild(diceDiv);
                }
            } else if (fireRate > 0) {
                d6PopupElements.extraHitsTitle.textContent = "Colpi Extra";  // TODO language
                d6PopupElements.extraHitsContainer.style.display = 'flex';
                for (let i = 0; i < fireRate; i++) {
                    const diceDiv = createD6Div(i, true);
                    d6PopupElements.extraHitsContainer.appendChild(diceDiv);
                }
            } else {
                 d6PopupElements.extraHitsTitle.textContent = "No Colpi Extra"; // TODO language
                 d6PopupElements.extraHitsContainer.style.display = 'none';
            }
            // Resetta i risultati
            d6PopupElements.totalDamage.textContent = 'Danni: ?';
            d6PopupElements.totalEffects.textContent = 'Effetti: ?';
            d6PopupElements.rollButton.textContent = 'Lancia';
        } else {
            const totEffects = d6PopupElements.popup.querySelectorAll('.d6-dice.d6-face-effect').length;
            const totDamage1 = d6PopupElements.popup.querySelectorAll('.d6-dice.d6-face-damage1').length;
            const totDamage2 = d6PopupElements.popup.querySelectorAll('.d6-dice.d6-face-damage2').length;

            d6PopupElements.totalDamage.textContent = `Danni: ${totEffects + totDamage1 + (totDamage2 * 2)}`;
            d6PopupElements.totalEffects.textContent = `Effetti: ${totEffects}`;
            d6PopupElements.rollButton.textContent = 'Rilancia';
        }
    }



    function handleD6Click(dice, index) {
        if (d6RollState.hasRolled && !dice.classList.contains('rerolled') &&  dice.textContent !== '?') {
            dice.classList.toggle("active");

            // TODO check for luck / ammo / ap
        }
    }

    /**
     * Gestisce il click sul pulsante per lanciare i dadi del danno.
     */
    function handleD6Roll() {
        const activeDice = popups.d6.querySelectorAll('.d6-dice.active');
        if (activeDice.length === 0) {
            return showNotification("Seleziona dei dadi da (ri)lanciare!");
        }

        // Calculate luck cost
        let luckCost = 0;
        if (d6RollState.hasRolled) {
            const rerolledCount = popups.d6.querySelectorAll('.d6-dice.rerolled').length;
            const payedLeftover = rerolledCount % 3; // 1 luck x 3 rerolls. Luck for leftover was paid previous roll.
            let freeRerolls = 0;
            if(payedLeftover > 0) {
                freeRerolls = 3 - payedLeftover;
            }
            luckCost = Math.floor((activeDice.length - freeRerolls) / 3);
        }

        if (characterData.currentLuck < luckCost) {
            return showNotification("Non hai abbastanza Fortuna per farlo!");
        }

        // Perform the roll
        characterData.currentLuck -= luckCost;

        const diceElements = d6PopupElements.popup.querySelectorAll('.d6-dice.active');

        diceElements.forEach(dice => {
            const roll = Math.floor(Math.random() * 6) + 1;
            dice.textContent = roll; // TODO mettere le immagini
            dice.classList.remove('active');
            if (d6RollState.hasRolled) {
                dice.classList.add('rerolled')
            }

            dice.classList.toggle("d6-face-damage1", roll === 1)
            dice.classList.toggle("d6-face-damage2", roll === 2)
            dice.classList.toggle("d6-face-effect", roll > 2 && roll < 5)
            dice.classList.toggle("d6-face-blank", roll >= 5)
            dice.textContent = ''
        });

        d6RollState.hasRolled = true;
        updateD6PopupUI();
    }



    // Elements specific to the Add Item Popup
    const addItemPopupElements = {
        select: popups.addItem.querySelector('#selector'),
        quantity: popups.addItem.querySelector('#quantitySelector'),
        confirmButton: popups.addItem.querySelector('.confirm-button')
    };

    window.openAddItemModal = (itemType) => {
        // This mapping makes the function much cleaner and easier to extend.
        const itemConfig = {
            // TODO use langData
            smallGuns: { data: weaponData, isWeapon: true },
            energyWeapons: { data: weaponData, isWeapon: true },
            bigGuns: { data: weaponData, isWeapon: true },
            meleeWeapons: { data: weaponData, isWeapon: true },
            explosives: { data: weaponData, isWeapon: true },
            throwing: { data: weaponData, isWeapon: true },
            food: { data: foodData },
            drinks: { data: drinksData },
            meds: { data: medsData },
            ammo: { data: ammoData }
        };

        const config = itemConfig[itemType];
        if (!config) return;

        // Filter items
        const availableItems = Object.values(config.data).filter(item =>
            !config.isWeapon || item.SKILL === itemType
        );

        // Populate select element
        addItemPopupElements.select.innerHTML = "";
        const formattedItemType = translate(config.isWeapon ? "weapons" : itemType)
        const defaultOptionText = translate("default_add_item_option").replace("%s", formattedItemType)
        const defaultOption = new Option(defaultOptionText, '', true, true);
        defaultOption.disabled = true;
        addItemPopupElements.select.appendChild(defaultOption);
        addItemPopupElements.select.dataItemType = itemType;

        availableItems.forEach(item => {
            const optionText = langData.it[item.ID] || item.ID; // Fallback to ID
            addItemPopupElements.select.appendChild(new Option(optionText, item.ID));
        });

        popups.addItem.showModal();
    };

    // Add item popup listener
    addItemPopupElements.confirmButton.addEventListener('click', () => {
        const selectedId = addItemPopupElements.select.value;
        const itemType = addItemPopupElements.select.dataItemType;
        const quantity = parseInt(addItemPopupElements.quantity.value);
        if (selectedId) {
            characterData.addItem(selectedId, itemType, quantity);
            addItemPopupElements.quantity.value = 1;
            console.log(`Adding item: ${selectedId} x${quantity}`);
            closeActivePopup();
        }
    });
});