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
        skillTitle: popups.d20.querySelector('#skill-throw-on'),
        apCost: popups.d20.querySelector('#ap-cost'),
        luckCost: popups.d20.querySelector('#luck-cost'),
        dice: popups.d20.querySelectorAll('.dice'),
        selector: popups.d20.querySelector('#popup-selector'),
        luckCheckbox: popups.d20.querySelector('.luck-checkbox'),
        aimCheckbox: popups.d20.querySelector('.aim-checkbox'),
        rollButton: popups.d20.querySelector('#roll-dice-button'),
        damageButton: popups.d20.querySelector('#throw-damage-button'),
        successesDisplay: popups.d20.querySelector('#successes'),
        targetNumberDisplay: popups.d20.querySelector('#target-number'),
        targetNumberDetails: popups.d20.querySelector('#target-number-details')
    };

    const d6PopupElements = {
        popup: popups.d6,
        weaponName: popups.d6.querySelector('#d6-weapon-name'),
        damageType: popups.d6.querySelector('#d6-damage-type'),
        tagsContainer: popups.d6.querySelector('#d6-tags'),
        damageDiceContainer: popups.d6.querySelector('#d6-damage-dice-container'),
        extraHitsTitle: popups.d6.querySelector('#d6-extra-hits-title'),
        extraHitsContainer: popups.d6.querySelector('#d6-extra-hits-container'),
        totalDamage: popups.d6.querySelector('#d6-total-damage'),
        totalEffects: popups.d6.querySelector('#d6-total-effects'),
        rollButton: popups.d6.querySelector('#d6-roll-button')
    };

    let d20RollState = {};
    let d6RollState = {};

    // Elements specific to the Add Item Popup
    const addItemPopupElements = {
        select: popups.addItem.querySelector('#selector'),
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

    /**
     * Resets the dice roll state to its default values.
     * @param {string} skillId The skill being rolled.
     * @param {string} [objectId] Optional ID of the item being used (e.g., a weapon).
     */
    function resetD20RollState(skillId, objectId) {
        d20RollState = {
            skillId: skillId,
            objectId: objectId,
            hasRolled: false,
            selectedSpecial: Character.getSpecialFromSkill(skillId),
            isUsingLuck: false,
            isAiming: false,
            activeDiceCount: 2,
            rerolledDice: new Set()
        };
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
     * Updates all displays in the d20 popup based on the current d20RollState.
     */
    function updateD20PopupUI() {
        const { skillId, selectedSpecial, hasRolled, isUsingLuck, isAiming, objectId } = d20RollState;

        // Update text and values
        d20PopupElements.skillTitle.textContent = langData[currentLanguage][skillId];
        d20PopupElements.selector.value = selectedSpecial;
        d20PopupElements.luckCheckbox.checked = isUsingLuck;
        d20PopupElements.aimCheckbox.checked = isAiming;

        // Update target numbers
        const skillVal = characterData.getSkill(skillId);
        const specialVal = characterData.getSpecial(selectedSpecial);
        d20PopupElements.targetNumberDisplay.textContent = `Target: ${specialVal + skillVal}`;
        d20PopupElements.targetNumberDetails.textContent = `[${skillVal}+${specialVal}]`;

        // Update dice visuals
        d20PopupElements.dice.forEach((dice, index) => {
            dice.textContent = "?";
            dice.classList.remove('roll-crit', 'roll-complication', 'rerolled');
            dice.classList.toggle('active', index < d20RollState.activeDiceCount);
        });

        // Update button states
        d20PopupElements.rollButton.textContent = hasRolled ? "Rilancia" : "Lancia";
        d20PopupElements.damageButton.style.display = objectId ? 'block' : 'none';
        d20PopupElements.damageButton.disabled = !hasRolled;
        d20PopupElements.successesDisplay.textContent = "Successi: ?";

        // Disable controls after the first roll
        d20PopupElements.selector.disabled = hasRolled || isUsingLuck;
        d20PopupElements.luckCheckbox.disabled = hasRolled;
        d20PopupElements.aimCheckbox.disabled = hasRolled;

        updateAPCostUI();
        updateLuckCostUI();
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
            d6PopupElements.weaponName.textContent = langData[currentLanguage][weapon.ID];
            d6PopupElements.damageType.textContent = weapon.DAMAGE_TYPE; // TODO Handle language

            weapon.EFFECTS.split(',').map(e => e.trim()).filter(e => e).forEach(effect => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = effect;
                d6PopupElements.tagsContainer.appendChild(tag);
            });

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
                d6PopupElements.extraHitsTitle.textContent = "Colpi Extra";
                d6PopupElements.extraHitsContainer.style.display = 'flex';
                for (let i = 0; i < fireRate; i++) {
                    const diceDiv = createD6Div(i, true);
                    d6PopupElements.extraHitsContainer.appendChild(diceDiv);
                }
            } else {
                 d6PopupElements.extraHitsTitle.textContent = "No Colpi Extra";
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

    /** Updates the AP cost display. */
    function updateAPCostUI() {
        const costMap = { 3: 1, 4: 3, 5: 6 };
        const cost = costMap[d20RollState.activeDiceCount] || 0;
        d20PopupElements.apCost.textContent = `Costo AP: ${cost}`;
    }

    /** Updates the Luck cost display. */
    function updateLuckCostUI() {
        let costs = [];
        if (d20RollState.isUsingLuck) costs.push(1);

        const rerollingCount = popups.d20.querySelectorAll('.dice.active').length;
        const rerolledCount = popups.d20.querySelectorAll('.dice.rerolled').length;

        if (d20RollState.hasRolled) {
            if (rerolledCount > 0) {
                costs.push(rerolledCount);
            }
            if (rerollingCount > 0) {
                costs.push(rerollingCount);
            }
        }
        if(d20RollState.isAiming){
            costs.push(-1);
        }

        const totalCost = costs.length > 0 ?
            costs.join('+').replaceAll("+-", "-")
                           .replaceAll("-1", "(-1)") : '0';
        d20PopupElements.luckCost.textContent = `Costo Fortuna: ${totalCost}`;
    }

    function handleD20Click(dice, index) {
        if (!d20RollState.hasRolled) {
            // Before the first roll, clicking a dice sets the number of dice to roll.
            const activeDice = Math.max(2, index + 1)
            d20RollState.activeDiceCount = activeDice;
            // Visually update only the necessary dice
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

    function handleD6Click(dice, index) {
        if (d6RollState.hasRolled && !dice.classList.contains('rerolled') &&  dice.textContent !== '?') {
            dice.classList.toggle("active");

            // TODO check for luck / ammo / ap
        }
    }

    function handleD20Roll() {
        const activeDice = popups.d20.querySelectorAll('.dice.active');
        if (activeDice.length === 0) {
            return showNotification("Seleziona dei dadi da (ri)lanciare!");
        }

        // Calculate luck cost
        let luckCost = 0;
        if (!d20RollState.hasRolled && d20RollState.isUsingLuck) {
            luckCost = 1;
        } else if (d20RollState.hasRolled) {
            const rerolledCount = popups.d20.querySelectorAll('.dice.rerolled').length;
            const aimDiscount = d20RollState.isAiming && rerolledCount === 0 ? 1 : 0;
            luckCost = activeDice.length - aimDiscount;
        }

        if (characterData.currentLuck < luckCost) {
            return showNotification("Non hai abbastanza Fortuna per farlo!");
        }

        // Perform the roll
        characterData.currentLuck -= luckCost;

        const critVal = characterData.hasSpecialty(d20RollState.skillId) ? characterData.getSkill(d20RollState.skillId) || 1 : 1;
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

        // Update state and UI
        d20RollState.hasRolled = true;

        // Recalculate successes from all dice shown
        let successes = 0;
        d20PopupElements.dice.forEach(dice => {
            const roll = Number(dice.textContent);
            if (!isNaN(roll)) {
                const targetVal = characterData.getSkill(d20RollState.skillId) + characterData.getSpecial(d20RollState.selectedSpecial);
                if (roll <= critVal) successes += 2;
                else if (roll <= targetVal) successes++;
            }
        });
        d20PopupElements.successesDisplay.textContent = `Successi: ${successes}`;

        // Update UI for the "post-roll" state
        d20PopupElements.rollButton.textContent = "Rilancia";
        d20PopupElements.damageButton.disabled = false;
        d20PopupElements.luckCheckbox.disabled = true;
        d20PopupElements.aimCheckbox.disabled = true;
        d20PopupElements.selector.disabled = true;
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

    window.openD6Popup = (weaponId) => {
        if (!weaponData[weaponId]) {
            return showNotification(`Arma non trovata: ${weaponId}`);
        }
        resetD6RollState(weaponId);
        updateD6PopupUI();
        popups.d6.showModal();
    };

    // Aggiunge l'event listener al pulsante del d6 popup
    d6PopupElements.rollButton.addEventListener('click', handleD6Roll);

    window.openD20Popup = (skillId, objectId) => {
        resetD20RollState(skillId, objectId);
        updateD20PopupUI();
        popups.d20.showModal();
    };

    window.openAddItemModal = (itemType) => {
        // This mapping makes the function much cleaner and easier to extend.
        const itemConfig = {
            smallGuns: { data: weaponData, name: 'Weapon', skill: 'smallGuns' },
            energyWeapons: { data: weaponData, name: 'Weapon', skill: 'energyWeapons' },
            bigGuns: { data: weaponData, name: 'Weapon', skill: 'bigGuns' },
            meleeWeapons: { data: weaponData, name: 'Weapon', skill: 'meleeWeapons' },
            explosives: { data: weaponData, name: 'Weapon', skill: 'explosives' },
            throwing: { data: weaponData, name: 'Weapon', skill: 'throwing' },
            food: { data: foodData, name: 'Food Item' },
            drinks: { data: drinksData, name: 'Drink' },
            meds: { data: medsData, name: 'Medicine' }
        };

        const config = itemConfig[itemType];
        if (!config) return;

        // Filter items
        const availableItems = Object.values(config.data).filter(item =>
            !config.skill || item.SKILL === config.skill
        );

        // Populate select element
        addItemPopupElements.select.innerHTML = "";
        const defaultOption = new Option(`Select a ${config.name} to Add`, '', true, true);
        defaultOption.disabled = true;
        addItemPopupElements.select.appendChild(defaultOption);
        addItemPopupElements.select.dataItemType = itemType

        availableItems.forEach(item => {
            const optionText = langData.it[item.ID] || item.ID; // Fallback to ID
            addItemPopupElements.select.appendChild(new Option(optionText, item.ID));
        });

        popups.addItem.showModal();
    };

    function closeActivePopup() {
        const activeDialog = document.querySelector('dialog[open]');
        if (activeDialog) {
            activeDialog.close();
        }
    }

    // Close buttons for all popups
    document.querySelectorAll('.popup .close-button, .popup .cancel-button').forEach(btn => {
        btn.addEventListener('click', closeActivePopup);
    });

    // Dice popup listeners
    d20PopupElements.dice.forEach((dice, index) => {
        dice.addEventListener('click', () => handleD20Click(dice, index));
    });

    d20PopupElements.luckCheckbox.addEventListener('change', () => {
        d20RollState.isUsingLuck = d20PopupElements.luckCheckbox.checked;
        if (d20RollState.isUsingLuck) {
            if (characterData.currentLuck > 0) {
                d20RollState.previousSpecial = d20RollState.selectedSpecial;
                d20RollState.selectedSpecial = 'luck';
            } else {
                showNotification("Non hai abbastanza Fortuna per farlo.");
                d20PopupElements.luckCheckbox.checked = false;
                d20RollState.isUsingLuck = false;
            }
        } else {
            d20RollState.selectedSpecial = d20RollState.previousSpecial;
        }
        updateD20PopupUI();
    });

    d20PopupElements.selector.addEventListener('change', (e) => {
        d20RollState.selectedSpecial = e.target.value;
        updateD20PopupUI();
    });

    d20PopupElements.rollButton.addEventListener('click', handleD20Roll);

    d20PopupElements.damageButton.addEventListener('click', () => {
        closeActivePopup();
        openD6Popup(d20RollState.objectId); // You would pass the weapon ID here
    });

    d20PopupElements.aimCheckbox.addEventListener('change', () => {
        d20RollState.isAiming = d20PopupElements.aimCheckbox.checked;
        // We only need to update the luck cost when aiming changes.
        updateLuckCostUI();
    });

    // Add item popup listener
    addItemPopupElements.confirmButton.addEventListener('click', () => {
        const selectedId = addItemPopupElements.select.value;
        const itemType = addItemPopupElements.select.dataItemType;
        if (selectedId) {
            characterData.addItem({id: selectedId, type: itemType});
            console.log(`Adding item: ${selectedId}`);
            closeActivePopup();
        }
    });
});