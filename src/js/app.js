import { Character, characterData, setCharacterData } from './character.js';
import { initI18n, changeLanguage as setLanguage, t } from './i18n.js';
import { MainDisplay, setMainDisplay } from './display.js';
import { SKILL_TO_SPECIAL_MAP } from './constants.js';
import { initializePopups } from './popup.js';
import Papa from 'papaparse';

let dataManager = undefined;
let cardFactory = undefined;

// Theme and language functions (defined before use to avoid hoisting issues)
const changeTheme = () => {
    let value = localStorage.getItem('theme');
    if (!['theme-fallout-3', 'theme-fallout-new-vegas'].includes(value)) {
        value = 'theme-fallout-3';
    }

    document.getElementById('theme-select').value = value;

    document.body.className = value;
    // Update the meta tag so the PWA updates the app colors
    const computedStyle = getComputedStyle(document.body);
    const primaryColor = computedStyle.getPropertyValue('--primary-color');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', primaryColor);

    localStorage.setItem('theme', value);
};

const changeLanguage = value => {
    if (!value) {
        value = localStorage.getItem('language');
        if (!['it', 'en'].includes(value)) {
            value = 'it';
        }
    }

    document.getElementById('language-select').value = value;

    // The i18n system handles language change automatically
    setLanguage(value);
};

// IMPORTANT: Keep this outside of DOMContentLoaded, or it flashes uglily before loading
changeTheme();

document.addEventListener('DOMContentLoaded', async () => {
    dataManager = new DataManager();
    await dataManager.loadAllData();

    cardFactory = new CardFactory();

    // Make globals available (simple and working approach)
    window.dataManager = dataManager;
    window.cardFactory = cardFactory;

    await initI18n();
    setCharacterData(Character.load());

    const mainDisplayInstance = new MainDisplay();
    setMainDisplay(mainDisplayInstance);

    initializePopups();
    characterData.dispatchAll();
});

// Make functions globally available for HTML onclick and other modules
window.changeLanguage = changeLanguage;
window.changeTheme = changeTheme;

class DataManager {
    constructor() {
        this.weapon = {};
        this.apparel = {};
        this.aid = {};
        this.other = {};

        this.perks = {};
        this.allItemData = {};
    }

    async loadAllData() {
        const [smallGuns, energyWeapons, bigGuns, meleeWeapons, throwing, explosives] =
            await Promise.all([
                this.#paParseCSV('data/weapon/smallGuns.csv'),
                this.#paParseCSV('data/weapon/energyWeapons.csv'),
                this.#paParseCSV('data/weapon/bigGuns.csv'),
                this.#paParseCSV('data/weapon/meleeWeapons.csv'),
                this.#paParseCSV('data/weapon/throwing.csv'),
                this.#paParseCSV('data/weapon/explosives.csv'),
            ]);
        this.weapon = {
            ...smallGuns,
            ...energyWeapons,
            ...bigGuns,
            ...meleeWeapons,
            ...throwing,
            ...explosives,
        };

        const [armor, clothing] = await Promise.all([
            this.#paParseCSV('data/apparel/armor.csv'),
            this.#paParseCSV('data/apparel/clothing.csv'),
        ]);
        this.apparel = { ...armor, ...clothing };

        const [food, drinks, meds] = await Promise.all([
            this.#paParseCSV('data/aid/food.csv'),
            this.#paParseCSV('data/aid/drinks.csv'),
            this.#paParseCSV('data/aid/meds.csv'),
        ]);
        this.aid = { ...food, ...drinks, ...meds };

        const [ammo] = await Promise.all([this.#paParseCSV('data/other/ammo.csv')]);
        this.other = { ...ammo };

        this.perks = await this.#paParseCSV('data/perks.csv');

        // Combine all item data into a single map for easy lookup
        this.allItemData = { ...this.weapon, ...this.apparel, ...this.aid, ...this.other };
    }

    getItemTypeMap() {
        return {
            weapon: [
                'smallGuns',
                'energyWeapons',
                'bigGuns',
                'meleeWeapons',
                'explosives',
                'throwing',
                'unarmed',
            ],
            apparel: [
                'clothing',
                'outfit',
                'headgear',
                'raiderArmor',
                'leatherArmor',
                'metalArmor',
                'combatArmor',
            ],
            aid: ['food', 'drinks', 'meds'],
            other: ['ammo'],
        };
    }

    isType(subtypeToCheck, type) {
        return this.getItemTypeMap()[type].includes(subtypeToCheck);
    }

    getItem(itemId) {
        return this.allItemData[itemId] || null;
    }

    getUnacquirableIds() {
        return ['weaponUnarmedStrike', 'weaponWeaponStock', 'weaponWeaponStockOneHanded'];
    }

    isUnacquirable(id) {
        if (id) {
            if (id.ID) {
                id = id.ID;
            }
            return this.getUnacquirableIds().includes(id);
        }
        return false;
    }

    #paParseCSV(fileUrl) {
        return new Promise((resolve, reject) => {
            Papa.parse(fileUrl, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: results => {
                    const dataMap = results.data.reduce((map, row) => {
                        for (const columnName in row) {
                            const value = row[columnName];

                            if (typeof value === 'string') {
                                const trimmedValue = value.trim();
                                if (
                                    (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) ||
                                    (trimmedValue.startsWith('{') && trimmedValue.endsWith('}'))
                                ) {
                                    try {
                                        row[columnName] = JSON.parse(trimmedValue);
                                    } catch (e) {
                                        console.error(
                                            `Something went wrong parsing trimmed value: ${trimmedValue}.\nError: ${e}`
                                        );
                                    }
                                }
                            }
                        }

                        map[row.ID] = row;
                        return map;
                    }, {});
                    resolve(dataMap);
                },
                error: reject,
            });
        });
    }
}

class CardFactory {
    #templates = {
        card: document.getElementById('t-card'),
        contentWeapon: document.getElementById('t-card__content-weapon'),
        contentAid: document.getElementById('t-card__content-aid'),
        contentApparel: document.getElementById('t-card__content-apparel'),
        cardAmmo: document.getElementById('t-cardAmmo'),
    };

    constructor() {}

    #createGenericCard(characterItem, customCardContent) {
        const [itemId, side] = characterItem.id.split('_');
        const item = window.dataManager.getItem(itemId);
        const quantity = characterItem.quantity;

        const template = this.#templates.card;
        const cardDiv = template.content.cloneNode(true).firstElementChild;

        cardDiv.dataset.itemId = item.ID;

        cardDiv.querySelector('.card-quantity').textContent = `${quantity}x`;
        cardDiv.querySelector('.card-name').dataset.i18n = item.ID;
        if (side) {
            // Handle side variations with i18next options
            cardDiv.querySelector('.card-name').dataset.i18nOptions = JSON.stringify({
                side: side,
            });
        }

        cardDiv.querySelector('.js-card-cost').textContent = item.COST;
        cardDiv.querySelector('.js-card-weight').textContent = item.WEIGHT;
        cardDiv.querySelector('.js-card-rarity').textContent = item.RARITY;

        const isWeapon = !!dataManager.weapon[item.ID];
        const cardButton = cardDiv.querySelector('.button-card');
        if (isWeapon) {
            cardButton.dataset.icon = 'attack';
            cardButton.dataset.action = 'attack';
            cardButton.checked = true; // Prevents default (so keeps it checked) on event handler
            cardButton.dataset.skill = item.TYPE;
            cardButton.dataset.objectId = item.ID;
        } else if (dataManager.apparel[item.ID]) {
            cardButton.dataset.icon = 'armor';
            cardButton.dataset.action = 'equip';
            cardButton.checked = characterItem.equipped === true;
            cardButton.dataset.type = item.TYPE;
            cardButton.dataset.objectId = characterItem.id;
        } else {
            // TODO implement consuming aid
            cardButton.disabled = true;
        }

        // Format description as paragraphs
        cardDiv.querySelector('.description').innerHTML = item.DESCRIPTION.split('. ')
            .map(paragraph => `<p>${paragraph}${paragraph.endsWith('.') ? '' : '.'}</p>`)
            .join('');

        cardDiv.querySelector('.js-card-content').appendChild(customCardContent);
        return cardDiv;
    }

    createAmmoEntry(characterItem) {
        const ammoId = characterItem.id;
        const quantity = characterItem.quantity;
        const template = this.#templates.cardAmmo;
        const ammoDiv = template.content.cloneNode(true).firstElementChild;
        ammoDiv.dataset.itemId = ammoId;
        ammoDiv.querySelector('.card-quantity').textContent = `${quantity}x`;
        ammoDiv.querySelector('.ammo-card-name').dataset.i18n = ammoId;
        return ammoDiv;
    }

    createWeaponCard(characterItem) {
        const weaponId = characterItem.id;
        const weaponObj = dataManager.weapon[weaponId];
        if (!weaponObj) {
            console.error(`Weapon data not found for ID: ${weaponId}`);
            return null;
        }

        const template = this.#templates.contentWeapon;
        const wcDiv = template.content.cloneNode(true).firstElementChild;
        wcDiv.querySelector('.js-cardWeapon-skill').dataset.i18n = weaponObj.TYPE;

        wcDiv.querySelector('.js-cardWeapon-target').textContent =
            characterData.getSkill(weaponObj.TYPE) +
            characterData.getSpecial(SKILL_TO_SPECIAL_MAP[weaponObj.TYPE]);
        wcDiv.querySelector('.js-cardWeapon-crit').textContent = Math.max(
            characterData.getSkill(weaponObj.TYPE),
            1
        ).toString();
        wcDiv.querySelector('.js-cardWeapon-ammoType').dataset.i18n =
            weaponObj.AMMO_TYPE === 'self' ? 'quantity' : weaponObj.AMMO_TYPE;
        wcDiv.querySelector('.js-cardWeapon-ammoCount').textContent =
            weaponObj.AMMO_TYPE === 'na'
                ? '-'
                : characterData.getItemQuantity(
                      weaponObj.AMMO_TYPE === 'self' ? weaponId : weaponObj.AMMO_TYPE
                  );

        wcDiv.querySelector('.js-cardWeapon-image').dataset.icon = weaponObj.TYPE;

        wcDiv.querySelector('.js-cardWeapon-damageRating').textContent = weaponObj.DAMAGE_RATING;
        wcDiv.querySelector('.js-cardWeapon-damageType').textContent = t(weaponObj.DAMAGE_TYPE);
        wcDiv.querySelector('.js-cardWeapon-fireRate').textContent = weaponObj.FIRE_RATE;
        wcDiv.querySelector('.js-cardWeapon-range').textContent = t(`${weaponObj.RANGE}Full`);

        const tagsContainer = wcDiv.querySelector('.tags-container');
        const createTagSpan = (text, className) => {
            const span = document.createElement('span');
            span.className = className;
            const [langId, opt] = text.split(':');
            span.dataset.tooltipId = `${langId}Description`;
            span.textContent = t(langId) + (opt ? ' ' + opt : '');
            return span;
        };
        const effectSpans = weaponObj.EFFECTS.map(effect => createTagSpan(effect, 'tag'));
        const qualitySpans = weaponObj.QUALITIES.map(quality =>
            createTagSpan(quality, 'tag tag-empty')
        );
        tagsContainer.append(...effectSpans, ...qualitySpans);

        return this.#createGenericCard(characterItem, wcDiv);
    }

    createApparelCard(characterItem) {
        const [apparelId, side] = characterItem.id.split('_');

        const apparelObj = dataManager.apparel[apparelId];
        if (!apparelObj) {
            console.error(`Apparel data not found for ID: ${apparelId}`);
            return null;
        }

        let sideSuffix = '';
        if (side) {
            sideSuffix = ` (${t(side)})`;
        }

        const template = this.#templates.contentApparel;
        const acDiv = template.content.cloneNode(true).firstElementChild;
        acDiv.querySelector('.js-cardApparel-physical').textContent = apparelObj.PHYSICAL_RES;
        acDiv.querySelector('.js-cardApparel-energy').textContent = apparelObj.ENERGY_RES;
        acDiv.querySelector('.js-cardApparel-radiation').textContent = apparelObj.RADIATION_RES;

        const protectsContainer = acDiv.querySelector('.js-cardApparel-protects');

        for (const location of apparelObj.LOCATIONS_COVERED) {
            const locationDiv = document.createElement('div');
            locationDiv.dataset.i18n = location;
            if (location === 'arm' || location === 'leg') {
                // Use i18next interpolation for side suffix
                locationDiv.dataset.i18nOptions = JSON.stringify({ side: sideSuffix });
            }
            protectsContainer.appendChild(locationDiv);
        }

        return this.#createGenericCard(characterItem, acDiv);
    }

    createAidCard(characterItem) {
        const aidId = characterItem.id;
        const type = characterItem.type;
        const aidObj = dataManager.aid[aidId];

        const template = this.#templates.contentAid;
        const acDiv = template.content.cloneNode(true).firstElementChild;
        acDiv.querySelector('.js-cardAid-image').dataset.icon = type;
        acDiv.querySelector('.js-cardAid-effect').textContent = aidObj.EFFECT; // TODO language

        const specificEffectStat = aidObj.HP_GAIN !== undefined ? 'HP_GAIN' : 'Duration'; // TODO language
        const prefix = specificEffectStat === 'HP_GAIN' ? '+' : '';
        acDiv.querySelector('.js-cardAid-specificEffect').textContent = specificEffectStat.replace(
            '_GAIN',
            ''
        );
        acDiv.querySelector('.js-cardAid-specificEffectVal').textContent =
            `${prefix}${aidObj[specificEffectStat.toUpperCase()]}`;

        const specificEffectStat2 = aidObj.RADIOACTIVE !== undefined ? 'Radioactive' : 'Addictive'; // TODO language
        acDiv.querySelector('.js-cardAid-specificEffect2').textContent = specificEffectStat2;
        acDiv.querySelector('.js-cardAid-specificEffectVal2').textContent =
            aidObj[specificEffectStat2.toUpperCase()];

        return this.#createGenericCard(characterItem, acDiv);
    }
}

// TODO find a better way, i dont like this. Also use it elsewhere where is needed
const getVariableFontSize = (text, maxFontSize = 2, step = 0.25, lineSize = 13) => {
    const rows = Math.ceil(text.length / lineSize);
    if (rows > 1) {
        return `${maxFontSize - rows * step}rem`;
    }
    return maxFontSize;
};
// Make getVariableFontSize globally available for popups
window.getVariableFontSize = getVariableFontSize;
