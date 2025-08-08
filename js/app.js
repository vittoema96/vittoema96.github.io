
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

const resetMemoryButton = document.getElementById('reset-memory-button');
resetMemoryButton.addEventListener('click', async () => {
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
    Character.getSkillList().forEach(key => translated[translate(key)] = key);


    for(const [skillTranslated, skill] of Object.entries(translated).sort()){
        const special = Character.getSpecialFromSkill(skill);
        const specialTranslated = translate(special);

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
                   class="themed-svg" data-icon="vaultboy">
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
 * @param {number} quantity The quantity of the object.
 * @returns {HTMLDivElement} The card's outer div element.
 */
function createGenericCard(genericItem, customCardContent, itemType, quantity) {
    if (!genericItem) {
        console.error(`Item data provided was null`);
        return null;
    }

    const template = document.getElementById('generic-card-template');
    const cardDiv = template.content.cloneNode(true).firstElementChild;

    cardDiv.dataset.itemId = genericItem.ID;
    cardDiv.dataset.itemType = itemType;

    cardDiv.querySelector('.card-quantity').textContent = `${quantity}x`;
    cardDiv.querySelector('.card-name').dataset.langId = genericItem.ID;
    cardDiv.querySelector('.card-cost-value').textContent = genericItem.COST;
    cardDiv.querySelector('.card-weight-value').textContent = genericItem.WEIGHT;
    cardDiv.querySelector('.card-rarity-value').textContent = genericItem.RARITY;

    const isWeapon = !!weaponData[genericItem.ID];
    const attackButton = cardDiv.querySelector('.card-attack-button');
    if(isWeapon){
        attackButton.dataset.action = "attack";
        attackButton.dataset.skill = genericItem.SKILL || "---";
        attackButton.dataset.objectId = genericItem.ID;
    } else {
        // TODO implement consuming supplies
        attackButton.disabled = true;
    }

    cardDiv.querySelector('.description').innerHTML =
        genericItem.DESCRIPTION.split('. ').map(
            paragraph => `<p>${paragraph}${paragraph.endsWith(".") ? "" : "."}</p>`
        ).join(''); // TODO is this the correct place to format this?

    cardDiv.querySelector('.card-controls').insertAdjacentHTML('beforebegin', customCardContent);

    return cardDiv;
}

function createAmmoEntry(ammoId, quantity){
     const template = document.getElementById('ammo-card-template');
     const ammoDiv = template.content.cloneNode(true).firstElementChild;
     ammoDiv.querySelector(".card-quantity").textContent = `${quantity}x`;
     ammoDiv.querySelector(".ammo-card-name").dataset.langId = ammoId;
     return ammoDiv;
}

function createWeaponCard(weaponId, quantity) {
    const weapon = weaponData[weaponId];
    if (!weapon) {
        console.error(`Weapon data not found for ID: ${weaponId}`);
        return null;
    }

    const ammoCount = characterData.getItemQuantity(weapon.AMMO_TYPE);

    // TODO implement as template
    // language=HTML
    let weaponHTML = `
        <div class="stats" id="stats-left">
            <div class="card-stat">
                <div data-lang-id="${weapon.SKILL}"></div>
                <div>To Hit: ${characterData.getSkill(weapon.SKILL) + characterData.getSpecial(Character.getSpecialFromSkill(weapon.SKILL))}</div>
                <div>To Crit: ${Math.max(characterData.getSkill(weapon.SKILL), 1)}</div>
            </div>
            <div class="card-stat">
                <div data-lang-id="${weapon.AMMO_TYPE}"></div>
                <div>${ammoCount}</div>
            </div>
        </div>
        <div class="card-image themed-svg" data-icon="${weapon.SKILL}"></div>
        <div class="stats" id="stats-right">
            <div class="card-stat">
                <div data-lang-id="damageDice">Damage Dice</div>
                <div>${weapon.DAMAGE_RATING}</div>
                <div>${weapon.DAMAGE_TYPE}</div>
            </div>
            <div class="card-stat">
                <div data-lang-id="fireRate">Fire Rate</div>
                <div>${weapon.FIRE_RATE}</div>
            </div>
            <div class="card-stat">
                <div data-lang-id="range">Range</div>
                <div>${weapon.RANGE}</div>
            </div>
        </div>
        <div class="tags-container">
            ${getListFromString(weapon.EFFECTS)
                    .map(effect => `<span class="tag" data-tooltip-id="${effect.split(' ')[0]}Description">${translate(effect)}</span>`).join('')}
        </div>`;

    return createGenericCard(weapon, weaponHTML, weapon.SKILL, quantity);
}

function createObjectCard(id, type, quantity) {
    const object = {...foodData, ...drinksData, ...medsData}[id];
    const specificEffectHeader = object.RADIOACTIVE !== undefined ? 'Radioactive' : 'Addictive';

    const hpGainHTML = type !== "meds" ? `<div class="card-stat"><div>HP</div><div>+${object.HP_GAIN}</div></div>` : "";

    // TODO implement as template
    // language=HTML
    const objectHTML = `
        <div class="stats">
            <div class="supply-img themed-svg" data-icon="${type}">
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

    return createGenericCard(object, objectHTML, type, quantity);
}

function changeTheme(value){
    if(!["theme-fallout-3", "theme-fallout-new-vegas"].includes(value)){
        value = "theme-fallout-3";
    }
    document.getElementById("theme-select").value = value;
    document.body.className = value;
    localStorage.setItem("theme", value);

    // Update the meta tag so the PWA updates the app colors
    const computedStyle = getComputedStyle(document.body);
    const primaryColor = computedStyle.getPropertyValue('--primary-color');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', primaryColor);
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
    loadTranslations();
});

window.getListFromString = (string) => {
    let result = string;
    result = result.split(','); // Divide elements
    result = result.map(e => e.trim()); // Remove whitespaces
    result = result.filter(e => e); // Filter out '', null, undefined, etc
    return result;
}