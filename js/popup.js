// Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {

    const popups = {
        d20: document.getElementById('d20-popup'),
        d6: document.getElementById('d6-popup'),
        addItem: document.getElementById('add-item-popup'),
        // It's good practice to add a dedicated notification popup instead of using alert() TODO
        notification: document.getElementById('notification-popup') 
    };

    const d20PopupElements = {
        skillTitle: document.getElementById('d20-popup-skill-title'),

        selector: document.getElementById('d20-popup-special-selector'),
        luckCheckbox: document.getElementById('d20-popup-luck-checkbox'),

        targetNumber: document.getElementById('d20-popup-target'),
        targetNumberBreakdown: document.getElementById('d20-popup-target-breakdown'),
        critBreakdown: document.getElementById('d20-popup-crit-breakdown'),

        dice: popups.d20.querySelectorAll('.d20-dice'),

        apCost: document.getElementById('d20-popup-ap-cost'),
        aimCheckbox: document.getElementById('d20-popup-aim-checkbox'),
        payedLuck: document.getElementById('d20-popup-payed-luck'),
        luckCost: document.getElementById('d20-popup-luck-cost'),

        successesDisplay: document.getElementById('d20-popup-successes-display'),

        rollButton: document.getElementById('d20-popup-roll-button'),
        damageButton: document.getElementById('d20-popup-damage-button'),
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

    let d20RollState = {};
    let d6RollState = {};

    // Elements specific to the Add Item Popup
    const addItemPopupElements = {
        select: popups.addItem.querySelector('#selector'),
        quantity: popups.addItem.querySelector('#quantitySelector'),
        confirmButton: popups.addItem.querySelector('.confirm-button')
    };


    /**
     * Shows a custom notification message. Replaces alert().
     * @param {string} message The message to display.
     */
    function showNotification(message) {
        // TODO This is a placeholder for custom notification logic.
        console.warn("Notification:", message); // For now, we log to the console.
        // Example:
        // const notificationText = popups.notification.querySelector('.message');
        // notificationText.textContent = message;
        // popups.notification.showModal();
        alert(message); // Reverted to alert for now so you can see it working.
    }

    function closeActivePopup() {
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



    window.openD20Popup = (skillId, objectId) => {
        resetD20Popup(skillId, objectId);
        popups.d20.showModal();
    };

    d20PopupElements.selector.addEventListener('change', updateTargetsD20Popup);
    d20PopupElements.luckCheckbox.addEventListener('change', onLuckCheckboxChange);
    d20PopupElements.dice.forEach((dice, index) => {
        dice.addEventListener('click', () => handleD20Click(dice, index));
    });
    d20PopupElements.aimCheckbox.addEventListener('change', updateLuckCostUI);
    d20PopupElements.damageButton.addEventListener('click', () => {
        closeActivePopup();
        openD6Popup(d20RollState.objectId);
    });
    d20PopupElements.rollButton.addEventListener('click', handleD20Roll);


    function resetD20Popup(skillId, objectId) {
        d20RollState = {
            skillId: skillId,
            objectId: objectId,
            hasRolled: false,
            previousSpecial: null
        }

        d20PopupElements.skillTitle.textContent = translate(skillId);

        d20PopupElements.selector.value = Character.getSpecialFromSkill(skillId);
        d20PopupElements.selector.disabled = false;
        d20PopupElements.luckCheckbox.checked = false;

        d20PopupElements.aimCheckbox.checked = false;

        updateTargetsD20Popup(skillId);

        d20PopupElements.dice.forEach((dice, index) => {
            dice.textContent = "?";
            dice.classList.remove('roll-crit', 'roll-complication', 'rerolled');
            dice.classList.toggle('active', index < 2);
        });

        updateAPCostUI();
        updateLuckCostUI();

        d20PopupElements.successesDisplay.textContent = `${translate("successes")}: ?`;

        // Update button states
        d20PopupElements.damageButton.style.display = objectId ? 'block' : 'none';
        d20PopupElements.damageButton.disabled = true;


        d20PopupElements.rollButton.textContent = getSpacedTranslation("roll", "reroll");
    }

    function getSpacedTranslation(langId, langId2) {
        const transl1 = translate(langId);
        const transl2 = translate(langId2);
        const l1 = transl1.length;
        const l2 = transl2.length;
        if(l1 >= l2){
            return transl1;
        } else {
            const diff = l2 - l1;
            return ' '.repeat(Math.floor(diff/2)) + transl1 + ' '.repeat(Math.ceil(diff/2));
        }
    }

    function updateTargetsD20Popup(){
        // Update target numbers
        const skillVal = characterData.getSkill(d20RollState.skillId);
        const specialVal = characterData.getSpecial(d20PopupElements.selector.value);
        const isSpecialty = characterData.hasSpecialty(d20RollState.skillId);
        d20PopupElements.targetNumber.textContent = `Target: ${specialVal + skillVal}`;
        d20PopupElements.targetNumberBreakdown.textContent = `${skillVal} (Skill) + ${specialVal} (Special)`;
        d20PopupElements.critBreakdown.textContent = `Critical Hit: Roll ${isSpecialty ? `≤ ${skillVal}` : `= 1`}`;
    }

    /** Updates the AP cost display. */
    function updateAPCostUI() {
        const costMap = { 3: 1, 4: 3, 5: 6 };
        const activeDice = popups.d20.querySelectorAll('.d20-dice.active').length;
        d20PopupElements.apCost.textContent = costMap[activeDice] || 0;
    }

    /** Updates the Luck cost display. */
    function updateLuckCostUI() {

        const aimingBonus = d20PopupElements.aimCheckbox.checked ? -1 : 0
        const useLuckCost = d20PopupElements.luckCheckbox.checked ? 1 : 0

        let alreadyPayed = 0;
        let toPay;
        if(!d20RollState.hasRolled){
            toPay = useLuckCost+aimingBonus;
        } else {
            const rerollingCount = popups.d20.querySelectorAll('.d20-dice.active').length;
            const rerolledCount = popups.d20.querySelectorAll('.d20-dice.rerolled').length;
            alreadyPayed = useLuckCost + aimingBonus + rerolledCount;
            toPay = rerollingCount + (alreadyPayed < 0 ? -1 : 0);
        }
        toPay = `(${toPay})`;
        alreadyPayed = alreadyPayed > 0 ? alreadyPayed : 0;

        d20PopupElements.payedLuck.textContent = alreadyPayed;
        d20PopupElements.luckCost.textContent = toPay;
    }

    function onLuckCheckboxChange() {
        const isUsingLuck = d20PopupElements.luckCheckbox.checked;
        if (isUsingLuck) {
            if (characterData.currentLuck > 0) {
                d20RollState.previousSpecial = d20PopupElements.selector.value;
                d20PopupElements.selector.value = 'luck';
                d20PopupElements.selector.disabled = true;
            } else {
                showNotification("Non hai abbastanza Fortuna per farlo.");
                d20PopupElements.luckCheckbox.checked = false;
            }
        } else {
            d20PopupElements.selector.disabled = false;
            d20PopupElements.selector.value = d20RollState.previousSpecial;
        }
        updateLuckCostUI();
    }

    function handleD20Click(dice, index) {
        if (!d20RollState.hasRolled) {
            // Before the first roll, clicking a dice sets the number of dice to roll.
            const activeDice = Math.max(2, index + 1)
            d20PopupElements.dice.forEach((d, i) => {
                d.classList.toggle('active', i < activeDice);
            });
            updateAPCostUI();
        } else {
            // After the first roll, clicking toggles dice for a re-roll.
            if (dice.textContent !== '?' && !dice.classList.contains('rerolled')) {
                dice.classList.toggle('active');
            }
        }
        updateLuckCostUI();
    }

    function handleD20Roll() {
        const skillId = d20RollState.skillId;
        const activeDice = popups.d20.querySelectorAll('.d20-dice.active');
        if (activeDice.length === 0) {
            return showNotification("Seleziona dei dadi da (ri)lanciare!");
        }

        let luckCost = eval(d20PopupElements.luckCost.textContent);
        luckCost = luckCost > 0 ? luckCost : 0;
        if (characterData.currentLuck < luckCost) {
            return showNotification("Non hai abbastanza Fortuna per farlo!");
        }

        characterData.currentLuck -= luckCost;

        d20PopupElements.selector.disabled = true;
        d20PopupElements.luckCheckbox.disabled = true;
        d20PopupElements.aimCheckbox.disabled = true;

        const critVal = characterData.hasSpecialty(skillId) ?
            characterData.getSkill(skillId) || 1 : 1;
        activeDice.forEach(dice => {
            const roll = Math.floor(Math.random() * 20) + 1;
            dice.textContent = roll;

            dice.classList.toggle('roll-complication', roll >= 20);
            dice.classList.toggle('roll-crit', roll <= critVal);

            dice.classList.remove('active');
            if (d20RollState.hasRolled) {
                dice.classList.add('rerolled');
            }
        });

        // Keep below dice rolls so they don't get "rerolled" on first roll
        d20RollState.hasRolled = true;

        // Recalculate successes from all dice shown
        let successes = 0;
        d20PopupElements.dice.forEach(dice => {
            const roll = Number(dice.textContent);
            if (!isNaN(roll)) {
                const targetVal = characterData.getSkill(skillId) + characterData.getSpecial(d20PopupElements.selector.value);
                if (roll <= critVal) successes += 2;
                else if (roll <= targetVal) successes++;
            }
        });
        d20PopupElements.successesDisplay.textContent = `${translate("successes")}: ${successes}`;

        // Update UI for the "post-roll" state
        d20PopupElements.damageButton.disabled = false;
        d20PopupElements.rollButton.textContent = getSpacedTranslation("reroll", "roll");
    }

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



    window.openD6Popup = (weaponId) => {
        if (!weaponData[weaponId]) {
            return showNotification(`Arma non trovata: ${weaponId}`);
        }
        resetD6RollState(weaponId);
        updateD6PopupUI();
        popups.d6.showModal();
    };

    d6PopupElements.rollButton.addEventListener('click', handleD6Roll);

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