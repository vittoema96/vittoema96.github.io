// <editor-fold desc="Set Loader version">
// As long as app.js is included after the <body>, this works fine without DOMContentLoaded
const versionBootLine = document.getElementById("appVersion");
versionBootLine.textContent = versionBootLine.textContent.replace("{version}", PROJECT_VERSION.toUpperCase())
// </editor-fold>

// <editor-fold desc="ServiceWorker Registration">
// KEEP THIS HERE
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js', { updateViaCache: 'none' }) // Always update service worker if online
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
    dataManager = new DataManager();
    await dataManager.loadAllData();

    translator = new Translator();
    await translator.init();

    createSkillEntries();

    characterData = Character.load();

    mainDisplay = new MainDisplay();

    characterData.dispatchAll();

    translator.loadTranslations();
});


const resetMemoryButton = document.getElementById('reset-memory-button');
resetMemoryButton.addEventListener('click', async () => {
    // TODO update setting selectors (also check defaults and how they work)
    confirmPopup(
        "deleteCharacterAlert",
        () => {
            localStorage.clear();
            alertPopup("dataWipeAlert");
            // Re-initialize the character to reflect the cleared state
            characterData = Character.load();
        }
    )
});

/**
 * Fills the #skills container with all the skills.
 */
function createSkillEntries(){
    const skillsContainer = document.querySelector("#skills")
    const translated = {};
    Object.values(SKILLS).forEach(key => translated[translator.translate(key)] = key);


    for(const [skillTranslated, skillId] of Object.entries(translated).sort()){
        const special = SKILL_TO_SPECIAL_MAP[skillId];
        const specialTranslated = translator.translate(special);

        const entryDiv = document.createElement('div');
        entryDiv.className = 'skill';
        entryDiv.dataset.skill = skillId.toString();
        entryDiv.innerHTML = `
            <span>
                <b>${skillTranslated}</b>
            </span>
            <span>
                <i>[${specialTranslated}]</i>
            </span>
            <span id="skill-${skillId}">0</span>
            <input id="specialty-${skillId}" type="checkbox"
                   disabled="disabled"
                   class="themed-svg" data-icon="vaultboy">
        `;
        skillsContainer.appendChild(entryDiv);
    }
}

function createGenericCard(genericItem, customCardContent, itemType, quantity) {
    if (!genericItem) {
        console.error(`Item data provided was null`);
        return null;
    }

    const template = document.getElementById('t-card');
    const cardDiv = template.content.cloneNode(true).firstElementChild;

    cardDiv.dataset.itemId = genericItem.ID;
    cardDiv.dataset.itemType = itemType;

    cardDiv.querySelector('.card-quantity').textContent = `${quantity}x`;
    cardDiv.querySelector('.card-name').dataset.langId = genericItem.ID;
    cardDiv.querySelector('.js-card-cost').textContent = genericItem.COST;
    cardDiv.querySelector('.js-card-weight').textContent = genericItem.WEIGHT;
    cardDiv.querySelector('.js-card-rarity').textContent = genericItem.RARITY;

    const isWeapon = !!dataManager.weapons[genericItem.ID];
    const attackButton = cardDiv.querySelector('.button-attack');
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

    //cardDiv.querySelector('.js-card-content').insertAdjacentElement('beforebegin', customCardContent);
    cardDiv.querySelector('.js-card-content').appendChild(customCardContent);
    return cardDiv;
}

function createAmmoEntry(ammoId, quantity){
     const template = document.getElementById('t-cardAmmo');
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

    const template = document.getElementById('t-card__content-weapon');
    const wcDiv = template.content.cloneNode(true).firstElementChild;
    wcDiv.querySelector('.js-cardWeapon-skill').dataset.langId = weapon.SKILL;
    
    wcDiv.querySelector('.js-cardWeapon-target').textContent = characterData.getSkill(weapon.SKILL) + characterData.getSpecial(SKILL_TO_SPECIAL_MAP[weapon.SKILL]);
    wcDiv.querySelector('.js-cardWeapon-crit').textContent = Math.max(characterData.getSkill(weapon.SKILL), 1).toString();
    wcDiv.querySelector('.js-cardWeapon-ammoType').dataset.langId = weapon.AMMO_TYPE;
    wcDiv.querySelector('.js-cardWeapon-ammoCount').textContent = isMelee(weapon.SKILL) ? '-' : characterData.getItemQuantity(weapon.AMMO_TYPE);
    
    wcDiv.querySelector('.js-cardWeapon-image').dataset.icon = weapon.SKILL;
    
    wcDiv.querySelector('.js-cardWeapon-damageRating').textContent = weapon.DAMAGE_RATING;
    wcDiv.querySelector('.js-cardWeapon-damageType').textContent = weapon.DAMAGE_TYPE; // TODO language
    wcDiv.querySelector('.js-cardWeapon-fireRate').textContent = weapon.FIRE_RATE;
    wcDiv.querySelector('.js-cardWeapon-range').textContent = weapon.RANGE; // TODO language
    
    const tagsContainer = wcDiv.querySelector('.tags-container');
    const createTagSpan = (text, className) => {
        const span = document.createElement('span');
        span.className = className;
        span.dataset.tooltipId = `${text.split(' ')[0]}Description`;
        span.dataset.langId = text;
        return span;
    };
    const effectSpans = weapon.EFFECTS.map(effect => createTagSpan(effect, 'tag'));
    const qualitySpans = weapon.QUALITIES.map(quality => createTagSpan(quality, 'tag tag-empty'));
    tagsContainer.append(...effectSpans, ...qualitySpans);

    return createGenericCard(weapon, wcDiv, weapon.SKILL, quantity);
}

function createObjectCard(id, type, quantity) {
    const object = {...dataManager.food, ...dataManager.drinks, ...dataManager.meds}[id];
    const specificEffectStat = object.RADIOACTIVE !== undefined ? 'Radioactive' : 'Addictive';

    const template = document.getElementById('t-card__content-aid');
    const acDiv = template.content.cloneNode(true).firstElementChild;
    acDiv.querySelector('.js-cardAid-image').dataset.icon = type;
    acDiv.querySelector('.js-cardAid-effect').textContent = object.EFFECT; // TODO language
    acDiv.querySelector('.js-cardAid-hpStat').dataset.icon = type;
    acDiv.querySelector('.js-cardAid-hpGain').style.display = type === 'meds' ? 'none' : 'block';
    acDiv.querySelector('.js-cardAid-specificEffect').textContent = specificEffectStat; // TODO language
    acDiv.querySelector('.js-cardAid-specificEffectVal').textContent = object[specificEffectStat.toUpperCase()];

    return createGenericCard(object, acDiv, type, quantity);
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

    getUnacquirableIds(){
        return ["weaponUnarmedStrike", "weaponWeaponStock", "weaponWeaponStockOneHanded"];
    }

    isUnacquirable(id){
        if(id){
            if(id.ID) id = id.ID;
            return this.getUnacquirableIds().includes(id);
        }
        return false;
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
                        for(let column of ["REQUISITES", "QUALITIES", "EFFECTS"]){
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
}

class CardFactory {
    // TODO
}

function getVariableFontSize(text, maxFontSize=2, step=.25, lineSize = 13){
    const rows = Math.ceil(text.length / lineSize);
    if(rows > 1){
        return `${maxFontSize - rows * step}rem`;
    }
    return maxFontSize
}