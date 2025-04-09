const overlay = document.querySelector(".overlay");
const popups = document.getElementsByClassName('popup');

const dicePopup = document.getElementById('dice-popup');
    const apCost = dicePopup.querySelector('.ap-cost');
    const diceElements = document.querySelectorAll('.dice');
const popupSelector = dicePopup.querySelector('#popup-selector');
const luckCheckbox = document.querySelector('.luck-checkbox');
const rollDiceButton = dicePopup.querySelector('.confirm-button');

const addItemPopup = document.getElementById('add-item-popup');

let activePopup = null;

function openDicePopup(skillId) {
    dicePopup.dataSkill = skillId;
    dicePopup.dataHasRolled = false;
    popupSelector.value = skill2special[skillId];
    dicePopup.querySelector('#skill-throw-on').textContent = "Tiro su " + langData[currentLanguage][skillId]
    popupSelector.disabled = false;
    luckCheckbox.checked = false;
    luckCheckbox.disabled = false;

    rollDiceButton.textContent = 'Lancia'
    rollDiceButton.addEventListener('click', rollDice);

    for (let i = 0; i < diceElements.length; i++) {
        diceElements[i].textContent = "?";
        diceElements[i].classList.remove('roll-crit');
        diceElements[i].classList.remove('roll-complication');
        diceElements[i].classList.remove('active');
        diceElements[i].classList.remove('inactive');
        diceElements[i].classList.remove('rerolled')
        if(i >= 2) {
            diceElements[i].classList.add('inactive');
        } else {
            diceElements[i].classList.add('active');
        }
    }

    updateModifier();

    overlay.classList.remove('hidden')
    dicePopup.classList.remove('hidden')
    activePopup = dicePopup;
}

function openAddItemPopup() {
    overlay.classList.remove('hidden')
    addItemPopup.classList.remove('hidden')
    activePopup = addItemPopup;
}


function openAddItemModal(itemType) {
    const popup = document.getElementById('add-item-popup');

    let availableItems = [];
    let itemName = '';
    let storageArray = '';

    if (Object.keys(skill2special).includes(itemType)) { // Only itemType that is a skill are weapons
        availableItems = Object.values(weaponData).filter(item => item.SKILL === itemType);
        itemName = 'Weapon';
        storageArray = characterData.weapons;
    } else if (itemType === 'food') {
        availableItems = Object.values(foodData);
        itemName = 'Food Item';
        storageArray = characterData.supplies.food;
    } else if (itemType === 'drinks') {
        availableItems = Object.values(drinksData);
        itemName = 'Drink';
        storageArray = characterData.supplies.drinks;
    } else if (itemType === 'meds') {
        availableItems = Object.values(medsData);
        itemName = 'Medicine';
        storageArray = characterData.supplies.meds;
    }

    if (availableItems.length > 0) {
        const selectElement = document.getElementById('selector');
        selectElement.innerHTML = "";

        const confirmButton = popup.querySelector('.confirm-button');
        const newConfirmButton = confirmButton.cloneNode(true);
        newConfirmButton.addEventListener('click', () => {
            if (selectElement.value) {
                storageArray.push(selectElement.value);
                updateDisplay();
                closePopup(); // You'll need to implement this
            }
        })
        popup.replaceChild(newConfirmButton, confirmButton);

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `Select a ${itemName} to Add`;
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectElement.appendChild(defaultOption);

        availableItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.ID;
            option.textContent = item.ID; // Display item name (you might want to show more info)
            selectElement.appendChild(option);
        });
    } else {
        const message = document.createElement('p');
        message.textContent = `No new ${itemName} items available.`;
        popupContent.appendChild(message);
    }
    openAddItemPopup();
}

function closePopup() {
    overlay.classList.add('hidden');
    activePopup.classList.add('hidden');
}



function updateModifier() {
    let activeCount = document.querySelectorAll('.dice.active').length;
    let modifier = 0;
    if (activeCount === 3) {
        modifier = 1;
    } else if (activeCount === 4) {
        modifier = 3;
    } else if (activeCount === 5) {
        modifier = 6;
    }
    apCost.textContent = `AP Cost: +${modifier}`;
}


// Close on ESC (on computer)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePopup();
    }
});


luckCheckbox.addEventListener('click', () => {
    if(luckCheckbox.checked) {
        luckCheckbox.dataPrevSpecial = popupSelector.value;
        popupSelector.value = 'luck'
        popupSelector.disabled = true;
    } else {
        popupSelector.value = luckCheckbox.dataPrevSpecial;
        luckCheckbox.dataPrevSpecial = undefined;
        popupSelector.disabled = false;
    }
});

function clickDice(dice, index) {
    if (!dicePopup.dataHasRolled) {
        if (dice.classList.contains('active')) {
            for (let i = Math.max(index, 2); i < diceElements.length; i++) {
                diceElements[i].classList.remove('active');
                diceElements[i].textContent = "?";
                diceElements[i].classList.remove('roll-crit');
                diceElements[i].classList.remove('roll-complication');
                diceElements[i].classList.add('inactive');
            }
        } else {
            for (let i = 0; i <= index; i++) {
                diceElements[i].classList.remove('inactive');
                diceElements[i].classList.add('active');
            }
        }
        updateModifier();
    } else {
        if (dice.classList.contains('active')) {
            dice.classList.remove('active');
            dice.classList.add('inactive');
        } else if (dice.classList.contains('inactive') && !dice.classList.contains('rerolled') && dice.textContent !== '?') {
            dice.classList.remove('inactive');
            dice.classList.add('active');
        }
    }
}

function rollDice() {
    let hasSelectedDice = false;
    let rerolledDice = 0;
    diceElements.forEach(dice => {
        if (dice.classList.contains('active')) {
            hasSelectedDice = true;
            const roll = Math.floor(Math.random() * 20) + 1;
            dice.textContent = roll;
            let critVal = 1;
            if(characterData.specialties.indexOf(dicePopup.dataSkill) > -1)
                critVal = characterData.skills[dicePopup.dataSkill] || 1;
            if( roll >= 20 ) {
                dice.classList.remove('roll-crit');
                dice.classList.add('roll-complication');
            } else if (roll <= critVal) {
                dice.classList.remove('roll-complication');
                dice.classList.add('roll-crit');
            } else {
                dice.classList.remove('roll-crit');
                dice.classList.remove('roll-complication');
            }
            dice.classList.remove('active')
            dice.classList.add('inactive')
            if(dicePopup.dataHasRolled) {
                dice.classList.add('rerolled')
                rerolledDice += 1;
            }
        }
    });
    if(!hasSelectedDice) {
        alert("Seleziona dei dadi da rilanciare!")
    } else {
        const decreaseLuck = dicePopup.dataHasRolled ? rerolledDice : luckCheckbox.checked ? 1 : 0;
        rollDiceButton.textContent = "Rilancia (Fortuna)"
        dicePopup.dataHasRolled = true;
        luckCheckbox.disabled = true;
        popupSelector.disabled = true;
        characterData.luckCurrent = characterData.luckCurrent - decreaseLuck;
        updateDisplay();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    for(let popup of popups) {
        const closeButton = popup.querySelector('.close-button');
        const cancelButton = popup.querySelector('.cancel-button');
        
        closeButton.addEventListener('click', closePopup);
        cancelButton.addEventListener('click', closePopup);
    }

    addItemPopup.querySelector('.confirm-button').addEventListener('click', () => {
        const value = addItemPopup.querySelector('#selector').value;

        if (value) {
            storageArray.push(value);
            updateDisplay();
            closePopup(); // You'll need to implement this
        }
    });

    overlay.addEventListener('click', (evt) => {
        if(evt.target === overlay)
            closePopup()
    }); // Close when clicking outside


    diceElements.forEach((dice, index) => {
        dice.addEventListener('click', () => clickDice(dice, index));
    });
});







