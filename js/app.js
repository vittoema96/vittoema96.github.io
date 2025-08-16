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
let cardFactory = undefined;

// IMPORTANT: Keep this outside of DOMContentLoaded, or it flashes uglily before loading
changeTheme()

document.addEventListener("DOMContentLoaded", async () => {
    dataManager = new DataManager();
    await dataManager.loadAllData();

    cardFactory = new CardFactory();

    translator = new Translator();
    await translator.init();

    characterData = Character.load();

    mainDisplay = new MainDisplay();

    characterData.dispatchAll();

    translator.loadTranslations();
});

function changeTheme(){
    let value = localStorage.getItem("theme");
    if(!["theme-fallout-3", "theme-fallout-new-vegas"].includes(value)){
        value = "theme-fallout-3";
    }

    document.getElementById("theme-select").value = value;

    document.body.className = value;
    // Update the meta tag so the PWA updates the app colors
    const computedStyle = getComputedStyle(document.body);
    const primaryColor = computedStyle.getPropertyValue('--primary-color');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', primaryColor);

    localStorage.setItem("theme", value);
}

function changeLanguage(){
    let value = localStorage.getItem('language');
    if(!["it", "en"].includes(value)){
        value = "it";
    }

    document.getElementById("language-select").value = value;

    currentLanguage = value;
    translator.loadTranslations();

    localStorage.setItem("language", value);
}

class DataManager {
    constructor(){
        this.weapons = {};
        this.clothing = {};
        this.armor = {};
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
            this.#paParseCSV('data/weapons/explosives.csv')
        ]);

        this.weapons = { ...smallGuns, ...energyWeapons, ...bigGuns, ...meleeWeapons, ...throwing, ...explosives };

        this.armor = this.#paParseCSV("data/apparel/armor.csv");
        this.clothing = this.#paParseCSV("data/apparel/clothing.csv");

        this.food = this.#paParseCSV("data/aid/food.csv");
        this.drinks = this.#paParseCSV("data/aid/drinks.csv");
        this.meds = this.#paParseCSV("data/aid/meds.csv");

        this.ammo = this.#paParseCSV("data/ammo.csv");
        this.perks = this.#paParseCSV("data/perks.csv");

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


                    const dataMap = results.data.reduce((map, row) => {
                        for (const columnName in row) {
                            const value = row[columnName];

                            if (typeof value === 'string') {
                                const trimmedValue = value.trim();
                                if ((trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) ||
                                    (trimmedValue.startsWith('{') && trimmedValue.endsWith('}'))) {
                                    try {
                                        row[columnName] = JSON.parse(trimmedValue);
                                    } catch (e) {
                                        console.error(`Something went wrong parsing trimmed value: ${trimmedValue}.\nError: ${e}`)
                                    }
                                }
                            }
                        }

                        map[row.ID] = row;
                        return map;
                    }, {});
                    resolve(dataMap);
                },
                error: reject
            });
        })
    }
}

class CardFactory {

    #templates = {
        card: document.getElementById('t-card'),
        contentWeapon: document.getElementById('t-card__content-weapon'),
        contentAid: document.getElementById('t-card__content-aid'),
        cardAmmo: document.getElementById('t-cardAmmo')
    }

    constructor() {}

    #createGenericCard(item, customCardContent, itemType, quantity) {
        if (!item) {
            console.error(`Item data provided was null`);
            return null;
        }

        const template = this.#templates.card;
        const cardDiv = template.content.cloneNode(true).firstElementChild;

        cardDiv.dataset.itemId = item.ID;
        cardDiv.dataset.itemType = itemType;

        cardDiv.querySelector('.card-quantity').textContent = `${quantity}x`;
        cardDiv.querySelector('.card-name').dataset.langId = item.ID;
        cardDiv.querySelector('.js-card-cost').textContent = item.COST;
        cardDiv.querySelector('.js-card-weight').textContent = item.WEIGHT;
        cardDiv.querySelector('.js-card-rarity').textContent = item.RARITY;

        const isWeapon = !!dataManager.weapons[item.ID];
        const attackButton = cardDiv.querySelector('.button-attack');
        if(isWeapon){
            attackButton.dataset.action = "attack";
            attackButton.dataset.skill = item.SKILL || "---";
            attackButton.dataset.objectId = item.ID;
        } else {
            // TODO implement consuming aid
            attackButton.disabled = true;
        }

        cardDiv.querySelector('.description').innerHTML =
            item.DESCRIPTION.split('. ').map(
                paragraph => `<p>${paragraph}${paragraph.endsWith(".") ? "" : "."}</p>`
            ).join(''); // TODO is this the correct place to format this?

        cardDiv.querySelector('.js-card-content').appendChild(customCardContent);
        return cardDiv;
    }

    createAmmoEntry(ammoId, quantity){
         const template = this.#templates.cardAmmo;
         const ammoDiv = template.content.cloneNode(true).firstElementChild;
         ammoDiv.dataset.itemId = ammoId;
         ammoDiv.dataset.itemType = "ammo";
         ammoDiv.querySelector(".card-quantity").textContent = `${quantity}x`;
         ammoDiv.querySelector(".ammo-card-name").dataset.langId = ammoId;
         return ammoDiv;
    }

    createWeaponCard(weaponId, quantity) {
        const weapon = dataManager.weapons[weaponId];
        if (!weapon) {
            console.error(`Weapon data not found for ID: ${weaponId}`);
            return null;
        }

        const template = this.#templates.contentWeapon;
        const wcDiv = template.content.cloneNode(true).firstElementChild;
        wcDiv.querySelector('.js-cardWeapon-skill').dataset.langId = weapon.SKILL;

        wcDiv.querySelector('.js-cardWeapon-target').textContent = characterData.getSkill(weapon.SKILL) + characterData.getSpecial(SKILL_TO_SPECIAL_MAP[weapon.SKILL]);
        wcDiv.querySelector('.js-cardWeapon-crit').textContent = Math.max(characterData.getSkill(weapon.SKILL), 1).toString();
        wcDiv.querySelector('.js-cardWeapon-ammoType').dataset.langId = weapon.AMMO_TYPE === 'self' ? 'quantity' : weapon.AMMO_TYPE;
        wcDiv.querySelector('.js-cardWeapon-ammoCount').textContent =
            weapon.AMMO_TYPE === 'na' ? '-'
                : characterData.getItemQuantity(weapon.AMMO_TYPE === 'self' ? weaponId : weapon.AMMO_TYPE);

        wcDiv.querySelector('.js-cardWeapon-image').dataset.icon = weapon.SKILL;

        wcDiv.querySelector('.js-cardWeapon-damageRating').textContent = weapon.DAMAGE_RATING;
        wcDiv.querySelector('.js-cardWeapon-damageType').textContent = weapon.DAMAGE_TYPE; // TODO language
        wcDiv.querySelector('.js-cardWeapon-fireRate').textContent = weapon.FIRE_RATE;
        wcDiv.querySelector('.js-cardWeapon-range').textContent = translator.translate(`${weapon.RANGE}Full`); // TODO language

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

        return this.#createGenericCard(weapon, wcDiv, weapon.SKILL, quantity);
    }

    createObjectCard(id, type, quantity) {
        const object = {...dataManager.food, ...dataManager.drinks, ...dataManager.meds}[id];
        const specificEffectStat = object.RADIOACTIVE !== undefined ? 'Radioactive' : 'Addictive';

        const template = this.#templates.contentAid;
        const acDiv = template.content.cloneNode(true).firstElementChild;
        acDiv.querySelector('.js-cardAid-image').dataset.icon = type;
        acDiv.querySelector('.js-cardAid-effect').textContent = object.EFFECT; // TODO language
        acDiv.querySelector('.js-cardAid-hpStat').dataset.icon = type;
        acDiv.querySelector('.js-cardAid-hpGain').style.display = type === 'meds' ? 'none' : 'block';
        acDiv.querySelector('.js-cardAid-specificEffect').textContent = specificEffectStat; // TODO language
        acDiv.querySelector('.js-cardAid-specificEffectVal').textContent = object[specificEffectStat.toUpperCase()];

        return this.#createGenericCard(object, acDiv, type, quantity);
    }
}

function getVariableFontSize(text, maxFontSize=2, step=.25, lineSize = 13){
    const rows = Math.ceil(text.length / lineSize);
    if(rows > 1){
        return `${maxFontSize - rows * step}rem`;
    }
    return maxFontSize
}

const BODY_PARTS = {
    HEAD: "head",
    LEFT_ARM: "leftArm",
    RIGHT_ARM: "rightArm",
    TORSO: "torso",
    LEFT_LEG: "leftLeg",
    RIGHT_LEG: "rightLeg",
}