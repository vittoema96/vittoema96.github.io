const overlay = document.querySelector(".overlay");
const popups = document.getElementsByClassName('popup');

const dicePopup = document.getElementById('dice-popup');
    const apCost = document.getElementById('ap-cost');
    const luckCost = document.getElementById('luck-cost');
    const diceElements = document.querySelectorAll('.dice');

const damagePopup = document.getElementById('damage-popup');
const popupSelector = dicePopup.querySelector('#popup-selector');
const luckCheckbox = document.querySelector('.luck-checkbox');
const aimCheckbox = document.querySelector('.aim-checkbox');
const rollDiceButton = document.getElementById('roll-dice-button');
const throwDamageButton = document.getElementById('throw-damage-button');
const successesDisplay = document.getElementById('successes');
const targetNumberDisplay = document.getElementById('target-number');
const targetNumberDetailsDisplay = document.getElementById('target-number-details');

const addItemPopup = document.getElementById('add-item-popup');

let activePopup = null;

function updateTargetNumbers(){
    const skillVal = characterData.getSkill(dicePopup.dataSkill);
    const specialVal = characterData.getSpecial(popupSelector.value);
    targetNumberDisplay.textContent = specialVal + skillVal;
    targetNumberDetailsDisplay.textContent = "[" + specialVal + "+" + skillVal + "]";
}

function openDamagePopup(weaponId) {
    overlay.classList.remove('hidden')
    damagePopup.classList.remove('hidden')
    activePopup = damagePopup;
}

function openDicePopup(skillId, objectId) {
    dicePopup.dataSkill = skillId;
    dicePopup.dataHasRolled = false;
    popupSelector.value = Character.getSpecialFromSkill(skillId);
    dicePopup.querySelector('#skill-throw-on').textContent = langData[currentLanguage][skillId]
    
    popupSelector.disabled = false;
    luckCheckbox.checked = false;
    luckCheckbox.disabled = false;
    aimCheckbox.checked = false;
    aimCheckbox.disabled = false;

    if(objectId){
        throwDamageButton.style.display = '';
    } else {
        throwDamageButton.style.display = 'none';
    }

    updateTargetNumbers();

    rollDiceButton.textContent = 'Lancia'
    rollDiceButton.addEventListener('click', rollDice);
    throwDamageButton.disabled = true;
    successesDisplay.textContent = "Successi: ?";

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

    updateAPCost();
    updateLuckCost();

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

    if (Character.getSkillList().indexOf(itemType) > -1) { // Only itemType that is a skill are weapons
        availableItems = Object.values(weaponData).filter(item => item.SKILL === itemType);
        itemName = 'Weapon';
    } else if (itemType === 'food') {
        availableItems = Object.values(foodData);
        itemName = 'Food Item';
    } else if (itemType === 'drinks') {
        availableItems = Object.values(drinksData);
        itemName = 'Drink';
    } else if (itemType === 'meds') {
        availableItems = Object.values(medsData);
        itemName = 'Medicine';
    }

    const selectElement = document.getElementById('selector');
    selectElement.innerHTML = "";

    // Clone Confirm button to erase previous click listeners
    const confirmButton = popup.querySelector('.confirm-button');
    const newConfirmButton = confirmButton.cloneNode(true);
    newConfirmButton.addEventListener('click', () => {
        if (selectElement.value) {
            characterData.addItem({id: selectElement.value, type: itemType}); // TODO do something better here
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
        option.textContent = langData.it[item.ID]; // TODO ACTUAL TRANSLATION HERE PLEASE
        selectElement.appendChild(option);
    });
    openAddItemPopup();
}

function closePopup() {
    overlay.classList.add('hidden');
    activePopup.classList.add('hidden');
}



function updateAPCost() {
    let activeCount = document.querySelectorAll('.dice.active').length;
    let modifier = 0;
    if (activeCount === 3) {
        modifier = 1;
    } else if (activeCount === 4) {
        modifier = 3;
    } else if (activeCount === 5) {
        modifier = 6;
    }
    apCost.textContent = `Costo AP: ${modifier}`;
}


// Close on ESC (on computer)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePopup();
    }
});

function updateLuckCost() {
    let rerolled = 0;
    let rerolling = 0;
    for(let dice of diceElements){
        if(dice.classList.contains('active'))
            rerolling++;
        if(dice.classList.contains('rerolled'))
            rerolled++;
    }
    let list = [];
    if(luckCheckbox.checked)
        list.push(1);
    if(aimCheckbox.checked) {
        if(rerolled > 0)
            rerolled--;
        else if(rerolling > 0)
            rerolling--;
    }
    if(rerolled > 0)
        list.push(rerolled);
    if(dicePopup.dataHasRolled && rerolling > 0)
        list.push(rerolling);
    if(list.length === 0)
        list = [0];
    luckCost.textContent = "Costo Fortuna: "+list.join("+")
}


luckCheckbox.addEventListener('click', () => {
    if(luckCheckbox.checked) {
        if(characterData.currentLuck > 0) {
            luckCheckbox.dataPrevSpecial = popupSelector.value;
            popupSelector.value = 'luck'
            popupSelector.disabled = true;
        } else {
            alert("Non hai abbastanza Fortuna per farlo.")
            luckCheckbox.checked = false;
        }
    } else {
        popupSelector.value = luckCheckbox.dataPrevSpecial;
        luckCheckbox.dataPrevSpecial = undefined;
        popupSelector.disabled = false;
    }
    updateLuckCost();
    updateTargetNumbers();
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
        updateAPCost();
    } else {
        if (dice.classList.contains('active')) {
            dice.classList.remove('active');
            dice.classList.add('inactive');
        } else if (dice.classList.contains('inactive') && !dice.classList.contains('rerolled') && dice.textContent !== '?') {
            dice.classList.remove('inactive');
            dice.classList.add('active');
        }
    }
    updateLuckCost();
}

function rollDice() {
    let hasSelectedDice = false;
    let rollingDice = 0;
    diceElements.forEach(dice => {
        if (dice.classList.contains('active')){
            hasSelectedDice = true;
            rollingDice++;
        }
    })
    let decreaseLuck = 0;
    if(dicePopup.dataHasRolled) {
        if(aimCheckbox.checked){
            decreaseLuck = rollingDice - 1;
        } else {
            decreaseLuck = rollingDice;
        }
    } else if (luckCheckbox.checked) {
        decreaseLuck = 1;
    }

    if(!hasSelectedDice) {
        alert("Seleziona dei dadi da rilanciare!")
    } else if(characterData.currentLuck < decreaseLuck) {
        alert("Non hai abbastanza Fortuna per farlo!")
    } else {
        diceElements.forEach(dice => {
            if (dice.classList.contains('active')) {
                const roll = Math.floor(Math.random() * 20) + 1;
                dice.textContent = roll;
                let critVal = 1;
                if(characterData.hasSpecialty(dicePopup.dataSkill))
                    critVal = characterData.getSkill(dicePopup.dataSkill) || 1;
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
                }
            }
        });

        let successes = 0;
        diceElements.forEach(dice => {
            let roll = Number(dice.textContent);
            let critVal = 1;
            if(characterData.hasSpecialty(dicePopup.dataSkill))
                critVal = characterData.getSkill(dicePopup.dataSkill) || 1;
            if(roll <= critVal)
                successes += 2;
            else if(roll <= characterData.getSkill(dicePopup.dataSkill) + characterData.getSpecial(popupSelector.value))
                successes++;
        })
        successesDisplay.textContent = "Successi: "+successes;
        rollDiceButton.textContent = "Rilancia"
        dicePopup.dataHasRolled = true;
        luckCheckbox.disabled = true;
        aimCheckbox.disabled = true;
        popupSelector.disabled = true;
        throwDamageButton.disabled = false;
        characterData.currentLuck = characterData.currentLuck - decreaseLuck;
    }
}

popupSelector.addEventListener("change", () => {
    updateTargetNumbers();
})

document.addEventListener("DOMContentLoaded", async () => {
    for(let popup of popups) {
        const closeButton = popup.querySelector('.close-button');
        const cancelButton = popup.querySelector('.cancel-button');
        
        closeButton.addEventListener('click', closePopup);
        cancelButton.addEventListener('click', closePopup);
    }

    overlay.addEventListener('click', (evt) => {
        if(evt.target === overlay)
            closePopup()
    }); // Close when clicking outside


    diceElements.forEach((dice, index) => {
        dice.addEventListener('click', () => clickDice(dice, index));
    });

    throwDamageButton.addEventListener('click', (evt) => {
        closePopup();
        openDamagePopup();
    })
});







