// Get references to DOM elements

let weaponData = undefined;
let foodData = undefined;
let drinksData = undefined;
let medsData = undefined;

const checkboxes = document.querySelectorAll('input[type="checkbox"][class="specialty-checkbox"]');
checkboxes.forEach(checkbox => {
    checkbox.disabled = true;
});

const clearLocalStorageButton = document.getElementById('clear-local-storage');
clearLocalStorageButton.addEventListener('click', async () => {
    let confirmedStorageWipe = confirm("Are you really sure you want to DELETE YOUR CHARACTER and every other saved data?")
    if (confirmedStorageWipe) {
        localStorage.clear();
        alert("Local data was wiped");
        // Re-initialize the character and display to reflect the cleared state
        characterData = new Character();
        display.initialize(characterData);
    }
});

async function loadWeapons() {
    return {
        ...await loadCSV('data/weapons/smallGuns.csv'),
        ...await loadCSV('data/weapons/energyWeapons.csv'),
        ...await loadCSV('data/weapons/bigGuns.csv'),
        ...await loadCSV('data/weapons/meleeWeapons.csv'),
        ...await loadCSV('data/weapons/throwing.csv'),
        ...await loadCSV('data/weapons/explosives.csv'),
    }
}

/**
 * Creates the HTML for a generic item card.
 * This function NO LONGER adds event listeners to prevent memory leaks.
 * All events are handled by delegation in the Display class.
 * @param {object} genericItem The item data.
 * @param {string} customCardContent The specific HTML for the item type.
 * @param {string} itemType The category of the item (e.g., 'smallGuns', 'food').
 * @returns {HTMLDivElement} The card's outer div element.
 */
function createGenericCard(genericItem, customCardContent, itemType) {
    if (!genericItem) {
        console.error(`Item data provided was null`);
        return null;
    }

    const cardDiv = document.createElement('div');
    // Add data attributes to the wrapper for event delegation
    cardDiv.className = 'card'; // A wrapper to help with event targeting
    cardDiv.dataset.itemId = genericItem.ID;
    cardDiv.dataset.itemType = itemType;

    const skillId = genericItem.SKILL || "---";
    const isWeapon = !!weaponData[genericItem.ID];

    // The attack button will have a data-action attribute instead of an inline onclick
    const attackButtonHTML = isWeapon
        ? `<button class="attack-button" data-action="attack" data-skill="${skillId}" data-object-id="${genericItem.ID}"></button>`
        : `<button class="attack-button" disabled></button>`; // Disabled for non-weapons

    cardDiv.innerHTML = `
        <div class="card-header">
            <div class="card-name" data-lang-id="${genericItem.ID}">${langData[currentLanguage][genericItem.ID]}</div>
            <div class="right-header">
                <div class="right-header-item"><div>Cost</div><div>${genericItem.COST}</div></div>
                <div class="right-header-item"><div>Weight</div><div>${genericItem.WEIGHT} kg</div></div>
                <div class="right-header-item"><div>Rarity</div><div>${genericItem.RARITY}</div></div>
            </div>
        </div>
        <div class="card-content">
            ${customCardContent}
            <div class="card-controls">
                ${attackButtonHTML}
                <button class="description-toggle" data-action="toggle-description">Mostra Descrizione</button>
            </div>
            <div class="description-container">
                <div class="description">
                    ${genericItem.DESCRIPTION.split('. ').map(paragraph => `<p>${paragraph}${paragraph.endsWith(".") ? "" : "."}</p>`).join('')}
                </div>
            </div>
        </div>
        <div class="card-overlay hidden">
            <div class="overlay-buttons">
                <button class="cancel-button" data-action="cancel-overlay">
                    <div class="fas fa-times"></div>
                </button>
                <button class="sell-button" data-action="sell">
                    <img class="fas" src="img/svg/caps.svg" alt="Sell"/>
                </button>
                <button class="delete-button" data-action="delete">
                    <div class="fas fa-trash"></div>
                </button>
            </div>
        </div>
    `;

    return cardDiv;
}


function createWeaponCard(weaponId) {
    const weapon = weaponData[weaponId];
    if (!weapon) {
        console.error(`Weapon data not found for ID: ${weaponId}`);
        return null;
    }

    const ammoCount = 0; // Placeholder

    let weaponHTML = `
        <div class="stats" id="stats-left">
            <div class="card-stat">
                <div data-lang-id="${weapon.SKILL}">${langData[currentLanguage][weapon.SKILL]}</div>
                <div>To Hit: ${characterData.getSkill(weapon.SKILL) + characterData.getSpecial(Character.getSpecialFromSkill(weapon.SKILL))}</div>
                <div>To Crit: ${Math.max(characterData.getSkill(weapon.SKILL), 1)}</div>
            </div>
            <div class="card-stat">
                <div data-lang-id="${weapon.AMMO_TYPE}">${langData[currentLanguage][weapon.AMMO_TYPE]}</div>
                <div>${ammoCount}</div>
            </div>
        </div>
        <div class="image">
            <img id="weapon-img" src="img/svg/${weapon.SKILL}.svg" alt="${weapon.ID}">
        </div>
        <div class="stats" id="stats-right">
            <div class="card-stat"><div>Damage Dice</div><div>${weapon.DAMAGE_RATING}</div><div>${weapon.DAMAGE_TYPE}</div></div>
            <div class="card-stat"><div>Fire Rate</div><div>${weapon.FIRE_RATE}</div></div>
            <div class="card-stat"><div>Range</div><div>${weapon.RANGE}</div></div>
        </div>
        <div class="card-tags">
            ${weapon.EFFECTS.split(',').map(e => e.trim()).filter(e => e !== "").map(effect => `<span class="tag">${effect}</span>`).join('')}
        </div>`;

    return createGenericCard(weapon, weaponHTML, weapon.SKILL);
}

function createObjectCard(id, type) {
    const object = {...foodData, ...drinksData, ...medsData}[id];
    const specificEffectHeader = object.RADIOACTIVE !== undefined ? 'Radioactive' : 'Addictive';

    const hpGainHTML = type !== "meds" ? `<div class="card-stat"><div>HP</div><div>+${object.HP_GAIN}</div></div>` : "";

    const objectHTML = `
        <div class="stats">
            <div class="image">
                <img src="img/svg/${type}.svg" alt="${type}" id="supply-img">
            </div>
        </div>
        <div class="stats"">
            <div style="margin: 10px; grid-column: 2 / 3;">${object.EFFECTS}</div>
        </div>
        <div class="stats" id="stats-right">
            ${hpGainHTML}
            <div class="card-stat">
                <div>${specificEffectHeader}</div>
                <div>${object[specificEffectHeader.toUpperCase()]}</div>
            </div>
        </div>
    `;

    return createGenericCard(object, objectHTML, type);
}

document.addEventListener("DOMContentLoaded", async () => {
    weaponData = await loadWeapons();
    foodData = await loadCSV("data/supplies/food.csv");
    drinksData = await loadCSV("data/supplies/drinks.csv");
    medsData = await loadCSV("data/supplies/meds.csv");

    display = new Display();
    characterData = new Character();
    display.initialize(characterData); // Pass character data to display
    loadTranslations(currentLanguage);
});