// <editor-fold desc="Set by deployment">
const PROJECT_VERSION = "PLACEHOLDER";
const HIDE_LOADER = true;

document.addEventListener("DOMContentLoaded", async () => {
    const versionBootLine = document.getElementById("appVersion");
    versionBootLine.textContent = versionBootLine.textContent.replace("{version}", PROJECT_VERSION.toUpperCase())
    if (HIDE_LOADER) {
        document.body.style.setProperty("--loader-display", "none");
    }
});
// </editor-fold>

// <editor-fold desc="ServiceWorker Registration">
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js')
            .then(registration => {
                console.log('Service Worker registered! 😎', registration);
                return navigator.serviceWorker.ready;
            }).catch(err => {
                console.log('Service Worker registration or setup failed! 😥', err);
            });
    });
}
// </editor-fold>


let dataManager = undefined;
let translator = undefined;

// IMPORTANT: Keep this outside of DOMContentLoaded, or it flashes uglily before loading
changeTheme(localStorage.getItem("theme"))

document.addEventListener("DOMContentLoaded", async () => {
    const versionBootLine = document.getElementById("appVersion");
    versionBootLine.textContent = versionBootLine.textContent.replace("{version}", PROJECT_VERSION.toUpperCase())

    dataManager = new DataManager();
    await dataManager.loadAllData();

    translator = new Translator();
    await translator.init();

    createSkillEntries();

    display = new Display();

    characterData = Character.load();
    display.initialize(characterData); // Pass character data to display
    translator.loadTranslations();
});


const resetMemoryButton = document.getElementById('reset-memory-button');
resetMemoryButton.addEventListener('click', async () => {
    // TODO update setting selectors (also check defaults and how they work)
    let confirmedStorageWipe = confirm("Are you really sure you want to DELETE YOUR CHARACTER and every other saved data?")
    if (confirmedStorageWipe) {
        localStorage.clear();
        alert("Local data was wiped");
        // Re-initialize the character and display to reflect the cleared state
        characterData = Character.load();
        display.initialize(characterData);
    }
});

/**
 * Fills the #skills container with all the skills.
 */
function createSkillEntries(){
    const skillsContainer = document.querySelector("#skills")
    const translated = {};
    Character.getSkillList().forEach(key => translated[translator.translate(key)] = key);


    for(const [skillTranslated, skillId] of Object.entries(translated).sort()){
        const special = SKILL_TO_SPECIAL_MAP[skillId];
        const specialTranslated = translator.translate(special);

        const entryDiv = document.createElement('div');
        entryDiv.className = 'skill';
        entryDiv.dataset.skill = skillId.toString();
        entryDiv.innerHTML = `
            <span style="flex: 4">
                <b>${skillTranslated}</b>
            </span>
            <span style="flex: 4">
                <i>[${specialTranslated}]</i>
            </span>
            <span id="skill-${skillId}" 
                  style="flex: 1">0</span>
            <input id="specialty-${skillId}" type="checkbox"
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

    const isWeapon = !!dataManager.weapons[genericItem.ID];
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
     ammoDiv.dataset.itemId = ammoId;
     ammoDiv.dataset.itemType = "ammo";
     ammoDiv.querySelector(".card-quantity").textContent = `${quantity}x`;
     ammoDiv.querySelector(".ammo-card-name").dataset.langId = ammoId;
     return ammoDiv;
}

function createWeaponCard(weaponId, quantity) {
    const weapon = dataManager.weapons[weaponId];
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
                <div>To Hit: ${characterData.getSkill(weapon.SKILL) + characterData.getSpecial(SKILL_TO_SPECIAL_MAP[weapon.SKILL])}</div>
                <div>To Crit: ${Math.max(characterData.getSkill(weapon.SKILL), 1)}</div>
            </div>
            <div class="card-stat">
                <div data-lang-id="${weapon.AMMO_TYPE}"></div>
                <div id="weaponAmmoCount">${ammoCount}</div>
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
            ${weapon.EFFECTS.map(effect => `<span class="tag" data-tooltip-id="${effect.split(' ')[0]}Description">${translator.translate(effect)}</span>`).join('')}
        </div>`;

    return createGenericCard(weapon, weaponHTML, weapon.SKILL, quantity);
}

function createObjectCard(id, type, quantity) {
    const object = {...dataManager.food, ...dataManager.drinks, ...dataManager.meds}[id];
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
            <div style="margin: 10px; grid-column: 2 / 3;">${object.EFFECT}</div>
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

class DataManager {
    constructor(){
        this.weapons = {};
        this.food = {};
        this.drinks = {};
        this.meds = {};
        this.ammo = {};
        this.perks = {};
        this.allItemData = {};
    }

    async loadAllData() {
        const [
            smallGuns, energyWeapons, bigGuns, meleeWeapons, throwing, explosives,
            food, drinks, meds, ammo, perks
        ] = await Promise.all([
            this.#paParseCSV('data/weapons/smallGuns.csv'),
            this.#paParseCSV('data/weapons/energyWeapons.csv'),
            this.#paParseCSV('data/weapons/bigGuns.csv'),
            this.#paParseCSV('data/weapons/meleeWeapons.csv'),
            this.#paParseCSV('data/weapons/throwing.csv'),
            this.#paParseCSV('data/weapons/explosives.csv'),
            this.#paParseCSV("data/supplies/food.csv"),
            this.#paParseCSV("data/supplies/drinks.csv"),
            this.#paParseCSV("data/supplies/meds.csv"),
            this.#paParseCSV("data/ammo.csv"),
            this.#paParseCSV("data/perks.csv")
        ]);

        this.weapons = { ...smallGuns, ...energyWeapons, ...bigGuns, ...meleeWeapons, ...throwing, ...explosives };
        this.food = food;
        this.drinks = drinks;
        this.meds = meds;
        this.ammo = ammo;
        this.perks = perks;

        // Combine all item data into a single map for easy lookup
        this.allItemData = { ...this.weapons, ...this.food, ...this.drinks, ...this.meds, ...this.ammo };
    }

    getItem(itemId) {
        return this.allItemData[itemId] || null;
    }

    #paParseCSV(fileUrl){
        return new Promise((resolve, reject) => {
            Papa.parse(fileUrl, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const result = results.data.reduce((map, entry) => {
                        for(let column of ["REQUISITES", "EFFECTS"]){
                            if(entry[column] && typeof entry[column] === "string"){
                                try {
                                    entry[column] = JSON.parse(entry[column]);
                                } catch (e) {
                                    console.error(`Could not parse ${column} for ID ${entry.ID}:`, entry[column]);
                                    entry[column] = {}; // Default to an empty object on failure
                                }
                            }
                        }
                        map[entry.ID] = entry;
                        return map;
                    }, {});
                    resolve(result);
                },
                error: reject
            });
        })
    }

    // TODO might not need
    getDataSourceForType(itemType) {
        const itemConfig = {
            smallGuns: { data: this.weapons, isWeapon: true },
            energyWeapons: { data: this.weapons, isWeapon: true },
            bigGuns: { data: this.weapons, isWeapon: true },
            meleeWeapons: { data: this.weapons, isWeapon: true },
            explosives: { data: this.weapons, isWeapon: true },
            throwing: { data: this.weapons, isWeapon: true },
            unarmed: { data: this.weapons, isWeapon: true },
            food: { data: this.food },
            drinks: { data: this.drinks },
            meds: { data: this.meds },
            ammo: { data: this.ammo }
        };
        return itemConfig[itemType] || null;
    }
}

class CardFactory {
    // TODO
}