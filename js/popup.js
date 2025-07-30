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

    // Elements specific to the Add Item Popup
    const addItemPopupElements = {
        select: popups.addItem.querySelector('#selector'),
        confirmButton: popups.addItem.querySelector('.confirm-button')
    };

    let diceRollState = {};

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
        diceRollState = {
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
     * Updates all displays in the dice popup based on the current diceRollState.
     */
    function updateD20PopupUI() {
        const { skillId, selectedSpecial, hasRolled, isUsingLuck, isAiming, objectId } = diceRollState;

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
            dice.classList.toggle('active', index < diceRollState.activeDiceCount);
            dice.classList.toggle('inactive', index >= diceRollState.activeDiceCount);
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

    /** Updates the AP cost display. */
    function updateAPCostUI() {
        const costMap = { 3: 1, 4: 3, 5: 6 };
        const cost = costMap[diceRollState.activeDiceCount] || 0;
        d20PopupElements.apCost.textContent = `Costo AP: ${cost}`;
    }

    /** Updates the Luck cost display. */
    function updateLuckCostUI() {
        let costs = [];
        if (diceRollState.isUsingLuck) costs.push(1);

        const rerollingCount = popups.d20.querySelectorAll('.dice.active').length;

        if (diceRollState.hasRolled && rerollingCount > 0) {
            let aimDiscount = diceRollState.isAiming ? 1 : 0;
            const rerollCost = Math.max(0, rerollingCount - aimDiscount);
            if(rerollCost > 0) costs.push(rerollCost);
        }

        const totalCost = costs.length > 0 ? costs.join('+') : '0';
        d20PopupElements.luckCost.textContent = `Costo Fortuna: ${totalCost}`;
    }

    function handleDiceClick(dice, index) {
        if (!diceRollState.hasRolled) {
            // Before the first roll, clicking a dice sets the number of dice to roll.
            const activeDice = Math.max(2, index + 1)
            diceRollState.activeDiceCount = activeDice;
            // Visually update only the necessary dice
            d20PopupElements.dice.forEach((d, i) => {
                d.classList.toggle('active', i < activeDice);
                d.classList.toggle('inactive', i >= activeDice);
            });
            updateAPCostUI();
        } else {
            // After the first roll, clicking toggles dice for a re-roll.
            if (dice.textContent !== '?' && !dice.classList.contains('rerolled')) {
                dice.classList.toggle('active');
                dice.classList.toggle('inactive');
            }
        }
        updateLuckCostUI();
    }

    function handleRollDice() {
        const activeDice = popups.d20.querySelectorAll('.dice.active');
        if (activeDice.length === 0) {
            return showNotification("Seleziona dei dadi da (ri)lanciare!");
        }

        // Calculate luck cost
        let luckCost = 0;
        if (!diceRollState.hasRolled && diceRollState.isUsingLuck) {
            luckCost = 1;
        } else if (diceRollState.hasRolled) {
            const aimDiscount = diceRollState.isAiming ? 1 : 0;
            luckCost = Math.max(0, activeDice.length - aimDiscount);
        }

        if (characterData.currentLuck < luckCost) {
            return showNotification("Non hai abbastanza Fortuna per farlo!");
        }

        // Perform the roll
        characterData.currentLuck -= luckCost;

        const critVal = characterData.hasSpecialty(diceRollState.skillId) ? characterData.getSkill(diceRollState.skillId) || 1 : 1;
        activeDice.forEach(dice => {
            const roll = Math.floor(Math.random() * 20) + 1;
            dice.textContent = roll;

            dice.classList.toggle('roll-complication', roll >= 20);
            dice.classList.toggle('roll-crit', roll <= critVal);

            dice.classList.remove('active');
            dice.classList.add('inactive');
            if (diceRollState.hasRolled) {
                dice.classList.add('rerolled');
            }
        });

        // Update state and UI
        diceRollState.hasRolled = true;

        // Recalculate successes from all dice shown
        let successes = 0;
        d20PopupElements.dice.forEach(dice => {
            const roll = Number(dice.textContent);
            if (!isNaN(roll)) {
                const targetVal = characterData.getSkill(diceRollState.skillId) + characterData.getSpecial(diceRollState.selectedSpecial);
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

    window.openD20Popup = (skillId, objectId) => {
        resetD20RollState(skillId, objectId);
        updateD20PopupUI();
        popups.d20.showModal();
    };

    window.openD6Popup = (weaponId) => {
        // Add logic for damage popup here
        popups.d6.showModal();
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
        dice.addEventListener('click', () => handleDiceClick(dice, index));
    });

    d20PopupElements.luckCheckbox.addEventListener('change', () => {
        diceRollState.isUsingLuck = d20PopupElements.luckCheckbox.checked;
        if (diceRollState.isUsingLuck) {
            if (characterData.currentLuck > 0) {
                diceRollState.previousSpecial = diceRollState.selectedSpecial;
                diceRollState.selectedSpecial = 'luck';
            } else {
                showNotification("Non hai abbastanza Fortuna per farlo.");
                d20PopupElements.luckCheckbox.checked = false;
                diceRollState.isUsingLuck = false;
            }
        } else {
            diceRollState.selectedSpecial = diceRollState.previousSpecial;
        }
        updateD20PopupUI();
    });

    d20PopupElements.selector.addEventListener('change', (e) => {
        diceRollState.selectedSpecial = e.target.value;
        updateD20PopupUI();
    });

    d20PopupElements.rollButton.addEventListener('click', handleRollDice);

    d20PopupElements.damageButton.addEventListener('click', () => {
        closeActivePopup();
        openD6Popup(); // You would pass the weapon ID here
    });

    d20PopupElements.aimCheckbox.addEventListener('change', () => {
        diceRollState.isAiming = d20PopupElements.aimCheckbox.checked;
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