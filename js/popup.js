const popups = document.getElementsByClassName('popup');
const dicePopup = document.getElementById('dice-popup');
const addItemPopup = document.getElementById('add-item-popup');

const overlay = document.getElementById('overlay');

let activePopup = null;

function openDicePopup() {
    dicePopup.style.display = 'block';
    overlay.style.display = 'block';
    activePopup = dicePopup;
}
function openAddItemPopup() {
    addItemPopup.style.display = 'block';
    overlay.style.display = 'block';
    activePopup = addItemPopup;
}


function openAddItemModal(itemType) {
    const popup = document.getElementById('add-item-popup');
    const popupContent = popup.querySelector('.popup-content');

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

        const confirmButton = popup.querySelector('.confirmButton');
        const newConfirmButton = confirmButton.cloneNode(true);
        newConfirmButton.addEventListener('click', () => {
            if (selectElement.value) {
                storageArray.push(selectElement.value);
                updateDisplay();
                closePopup(); // You'll need to implement this
            }
        })
        popupContent.replaceChild(newConfirmButton, confirmButton);

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
    activePopup.style.display = 'none';
    overlay.style.display = 'none';
}




// Close on ESC (on computer)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePopup();
    }
});


document.addEventListener("DOMContentLoaded", async () => {
    for(let popup of popups) {
        const closeButton = popup.querySelector('.close-button');
        const cancelButton = popup.querySelector('.cancelButton');
        
        closeButton.addEventListener('click', closePopup);
        cancelButton.addEventListener('click', closePopup);
    }



    dicePopup.querySelector('.confirmButton').addEventListener('click', () => {
        alert("... ma non succede nulla!");
        closePopup();
    });
    addItemPopup.querySelector('.confirmButton').addEventListener('click', () => {
        const value = addItemPopup.querySelector('#selector').value;

        if (value) {
            storageArray.push(value);
            updateDisplay();
            closePopup(); // You'll need to implement this
        }
    });

    overlay.addEventListener('click', closePopup); // Close when clicking outside
});