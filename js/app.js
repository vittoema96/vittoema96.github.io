
// FIRST THING: ServiceWorker Registration
//    Allows cache to be loaded the next times
//    the app/tab is opened
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js')
            .then(registration => {
                console.log('Service Worker registered! 😎', registration);
            })
            .catch(err => {
                console.log('Service Worker registration failed! 😥', err);
            });
    });
}


// Get references to DOM elements
let weaponData = undefined;
let foodData = undefined;
let drinksData = undefined;
let medsData = undefined;
let ammoData = undefined;

const clearLocalStorageButton = document.getElementById('clear-local-storage');
clearLocalStorageButton.addEventListener('click', async () => {
    // TODO update setting selectors (also check defaults and how they work)
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
 * Fills the #skills container with all the skills.
 */
function createSkillEntries(){
    const skillsContainer = document.querySelector("#skills")
    const translated = {};
    Character.getSkillList().forEach(key => translated[langData[currentLanguage][key]] = key);


    for(const [skillTranslated, skill] of Object.entries(translated).sort()){
        const special = Character.getSpecialFromSkill(skill);
        const specialTranslated = langData[currentLanguage][special];

        const entryDiv = document.createElement('div');
        entryDiv.className = 'skill';
        entryDiv.dataset.skill = skill;
        entryDiv.innerHTML = `
            <span style="flex: 4">
                <b>${skillTranslated}</b>
            </span>
            <span style="flex: 4">
                <i>[${specialTranslated}]</i>
            </span>
            <span id="skill-${skill}" 
                  style="flex: 1">0</span>
            <input id="specialty-${skill}" type="checkbox"
                   disabled="disabled"
                   class="themed-svg" style="--image-url: url('../img/svg/vaultboy.svg')">
        `;
        skillsContainer.appendChild(entryDiv);
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
        ? `<button class="themed-svg attack-button" data-action="attack" data-skill="${skillId}" data-object-id="${genericItem.ID}"></button>`
        : `<button class="themed-svg attack-button" disabled></button>`; // Disabled for non-weapons

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
        <div class="card-overlay hidden"> <!-- TODO Redo buttons, they are ugly -->
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

    // language=HTML
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
        <div class="image themed-svg" style="--image-url: url('../img/svg/${weapon.SKILL}.svg')">
       
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

    // language=HTML
    const objectHTML = `
        <div class="stats">
            <div class="supply-img themed-svg" style="--image-url: url('../img/svg/${type}.svg')">
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

function changeTheme(value){
    if(!["theme-fallout-3", "theme-fallout-new-vegas"].includes(value)){
        value = "theme-fallout-3";
    }
    document.getElementById("theme-select").value = value;
    document.body.className = value;
    localStorage.setItem("theme", value);
}
changeTheme(localStorage.getItem("theme"))

document.addEventListener("DOMContentLoaded", async () => {
    weaponData = await loadWeapons();
    foodData = await loadCSV("data/supplies/food.csv");
    drinksData = await loadCSV("data/supplies/drinks.csv");
    medsData = await loadCSV("data/supplies/meds.csv");
    ammoData = await loadCSV("data/ammo.csv");

    createSkillEntries();

    display = new Display();
    characterData = new Character();
    display.initialize(characterData); // Pass character data to display
    loadTranslations(currentLanguage);
});