import { characterData, Character, setCharacterData } from './character.js';
import { SPECIAL, SKILLS, SKILL_TO_SPECIAL_MAP, BODY_PARTS } from './constants.js';
import { t, updateDOM } from './i18n.js';
import { isMelee } from './gameRules.js';
import Panzoom from '@panzoom/panzoom';

// TODO: Replace with dependency injection
const getDataManager = () => window.dataManager;

export let mainDisplay = undefined;

// Helper function to create DOM element maps
const getDisplayMap = (list, format) =>
    list.reduce((acc, el) => {
        acc[el] = document.getElementById(format.replace('%s', el));
        return acc;
    }, {});

// Helper function to set main display instance
export const setMainDisplay = display => {
    mainDisplay = display;
};

export class DisplayInterface {
    _dom;
    _rootElement;

    _eventController = new AbortController();

    dispose() {
        this._eventController.abort();
    }

    constructor(rootElementId) {
        this._rootElement = document.getElementById(rootElementId);
    }

    _onChange(changeType, callback) {
        if (typeof changeType === 'string') {
            changeType = [changeType];
        }
        for (const type of changeType) {
            characterData.addEventListener(
                `change:${type}`,
                e => {
                    callback(e);
                },
                { signal: this._eventController.signal }
            );
        }
    }

    _onChangeSet(changeType, element, value, callback) {
        this._onChange(changeType, e => {
            element[value] = callback ? callback(e) : e.detail;
        });
    }

    _onChangeSetText(changeType, element, valueCallback = null) {
        this._onChangeSet(changeType, element, 'textContent', valueCallback);
    }

    _onChangeSetValue(changeType, element, valueCallback = null) {
        this._onChangeSet(changeType, element, 'value', valueCallback);
    }

    _onChangeSetChecked(changeType, element, valueCallback = null) {
        this._onChangeSet(changeType, element, 'checked', valueCallback);
    }
}

export class MainDisplay extends DisplayInterface {
    #statDisplay;
    #invDisplay;
    #dataDisplay;
    #mapDisplay;
    #settingsDisplay;

    dispose() {
        this.#getScreens().forEach(s => s.dispose());
        super.dispose();
    }

    constructor() {
        super('js-main-display');
        this._dom = {
            hp: document.getElementById('c-headerStats__hp'),
            caps: document.getElementById('c-headerStats__caps'),
            weight: document.getElementById('c-headerStats__weight'),

            tabButtons: document.querySelectorAll('.tab-button'),
        };

        this.#statDisplay = new StatDisplay();
        this.#invDisplay = new InvDisplay();
        this.#dataDisplay = new DataDisplay();
        this.#mapDisplay = new MapDisplay();
        this.#settingsDisplay = new SettingsDisplay();

        this._onChangeSetText(
            ['currentHp', 'level', SPECIAL.ENDURANCE, SPECIAL.LUCK],
            this._dom.hp,
            () => {
                return `${characterData.currentHp}/${characterData.maxHp}`;
            }
        );
        this._onChangeSetText('caps', this._dom.caps);
        this._onChangeSetText(['items', 'strength'], this._dom.weight, () => this.#updateWeight());

        this._dom.tabButtons.forEach(tab => {
            tab.addEventListener(
                'click',
                e => {
                    this.#openTab(e.target.closest('.tab-button'));
                },
                { signal: this._eventController.signal }
            );
        });

        // Trigger i18n update for the newly created elements
        updateDOM();
    }

    #openTab(tab) {
        const tabId = tab.dataset.tabId;
        const targetScreen = `${tabId}-tabContent`;

        // Hide all screens and deactivate all tabs
        this.#getScreens().forEach(s =>
            s._rootElement.classList.toggle('hidden', s._rootElement.id !== targetScreen)
        );
        this._dom.tabButtons.forEach(t => t.classList.toggle('active', t === tab));

        // Map initialization logic
        if (tabId === 'map') {
            if (this.#mapDisplay._dom.mapImage.complete) {
                this.#mapDisplay._initializePanzoom();
            } else {
                this.#mapDisplay._dom.mapImage.onload = this.#mapDisplay._initializePanzoom;
            }
        } else {
            this.#mapDisplay._disposePanzoom();
        }
    }

    #getScreens() {
        return [
            this.#statDisplay,
            this.#invDisplay,
            this.#dataDisplay,
            this.#mapDisplay,
            this.#settingsDisplay,
        ];
    }

    #updateWeight() {
        this._dom.weight.style.color =
            characterData.currentWeight > characterData.maxWeight ? 'red' : 'var(--primary-color)';
        return `${characterData.currentWeight.toFixed(1)}/${characterData.maxWeight}`;
    }
}

export class StatDisplay extends DisplayInterface {
    #isEditing = false;

    constructor() {
        super('stat-tabContent');

        this.#createSkillEntries();

        this._dom = {
            specials: getDisplayMap(Object.values(SPECIAL), 'special__value-%s'),
            currentLuck: document.getElementById('luck-current-value'),

            defense: document.getElementById('defense-value'),
            initiative: document.getElementById('initiative-value'),
            meleeDamage: document.getElementById('melee-damage-value'),

            skills: getDisplayMap(Object.values(SKILLS), 'skill-%s'),
            specialties: getDisplayMap(Object.values(SKILLS), 'specialty-%s'),

            editStatsButton: document.getElementById('edit-stats-button'),
        };

        Object.values(SPECIAL).forEach(special =>
            this._onChangeSetText(special, this._dom.specials[special])
        );
        this._onChangeSetText('currentLuck', this._dom.currentLuck);
        this._dom.currentLuck.parentElement.addEventListener(
            'click',
            () => {
                if (!this.#isEditing) {
                    confirmPopup('replenishLuckAlert', () => {
                        characterData.currentLuck = characterData.getSpecial(SPECIAL.LUCK);
                    });
                }
            },
            { signal: this._eventController.signal }
        );

        this._onChangeSetText(SPECIAL.AGILITY, this._dom.defense, () => characterData.defense);
        this._onChangeSetText(
            [SPECIAL.AGILITY, SPECIAL.PERCEPTION],
            this._dom.initiative,
            () => characterData.initiative
        );
        this._onChangeSetText(
            SPECIAL.STRENGTH,
            this._dom.meleeDamage,
            () => `+${characterData.meleeDamage}`
        );

        Object.values(SKILLS).forEach(skill => {
            this._onChangeSetText(skill, this._dom.skills[skill]);
            this._onChangeSetChecked(`specialty-${skill}`, this._dom.specialties[skill]);
        });

        this._dom.editStatsButton.addEventListener('click', () => this.#toggleEditMode(), {
            signal: this._eventController.signal,
        });
        Object.values(SPECIAL).forEach(special =>
            this._dom.specials[special]
                .closest('.special')
                ?.addEventListener('click', e => this.#handleSpecialClick(e), {
                    signal: this._eventController.signal,
                })
        );
        Object.values(SKILLS).forEach(skill =>
            this._dom.skills[skill]
                .closest('.skill')
                ?.addEventListener('click', e => this.#handleSkillClick(e), {
                    signal: this._eventController.signal,
                })
        );
    }

    /**
     * Fills the #skills container with all the skills.
     */
    #createSkillEntries() {
        const skillsContainer = document.querySelector('#skills');
        skillsContainer.innerHTML = '';

        // Sort skills by their translated names for consistent ordering
        const skillEntries = Object.values(SKILLS)
            .map(skillId => ({
                skillId,
                translatedName: t(skillId),
            }))
            .sort((a, b) => a.translatedName.localeCompare(b.translatedName));

        for (const { skillId } of skillEntries) {
            const special = SKILL_TO_SPECIAL_MAP[skillId];

            const entryDiv = document.createElement('div');
            entryDiv.className = 'skill';
            entryDiv.dataset.skill = skillId.toString();
            entryDiv.innerHTML = `
                <span>
                    <b data-i18n="${skillId}"></b>
                </span>
                <span>
                    <i>[<span data-i18n="${special}"></span>]</i>
                </span>
                <span id="skill-${skillId}">0</span>
                <input id="specialty-${skillId}" type="checkbox"
                       disabled="disabled"
                       class="themed-svg" data-icon="vaultboy">
            `;
            skillsContainer.appendChild(entryDiv);
        }
    }

    #toggleEditMode() {
        this.#isEditing = !this.#isEditing;
        // Disable/enable tab buttons
        if (mainDisplay && mainDisplay._dom && mainDisplay._dom.tabButtons) {
            mainDisplay._dom.tabButtons.forEach(el => (el.disabled = this.#isEditing));
        }
        // Enable/disable specialty checkboxes
        Object.values(this._dom.specialties).forEach(cb => {
            cb.disabled = !this.#isEditing;
        });
        this._dom.editStatsButton.textContent = this.#isEditing ? t('stopEditing') : t('editStats');

        console.log(`Edit mode ${this.#isEditing ? 'enabled' : 'disabled'}`);
        console.log(
            'Specialty checkboxes:',
            Object.values(this._dom.specialties).map(cb => cb.disabled)
        );
    }

    #handleSpecialClick(event) {
        if (!this.#isEditing) {
            return;
        }
        const specialDiv = event.target.closest('.special');
        const special = specialDiv.dataset.special;

        // Get origin-based maximum for this SPECIAL
        const max = this.#getSpecialMax(special);
        const current = characterData.getSpecial(special);
        const next = current < max ? current + 1 : 4;

        console.log(
            `Clicking ${special}: ${current} → ${next} (max: ${max}, origin: ${characterData.origin})`
        );
        characterData.setSpecial(special, next);

        // Update current luck MAX if luck special changes (but don't change current luck value)
        if (special === SPECIAL.LUCK) {
            // If current luck is higher than new max, cap it
            if (characterData.currentLuck > next) {
                characterData.currentLuck = next;
            }
        }
    }

    #getSpecialMax(special) {
        const origin = characterData.origin;

        if (origin === 'superMutant') {
            if (special === SPECIAL.STRENGTH || special === SPECIAL.ENDURANCE) {
                return 12;
            } else if (special === SPECIAL.INTELLIGENCE || special === SPECIAL.CHARISMA) {
                return 6;
            } else {
                return 10; // Perception, Agility, Luck
            }
        } else {
            // All other origins: max 10 for all SPECIAL
            return 10;
        }
    }

    #handleSkillClick(event) {
        const skillDiv = event.target.closest('.skill');
        const skillName = skillDiv.dataset.skill;

        if (this.#isEditing) {
            const checkbox = skillDiv.querySelector('input');
            if (event.target === checkbox) {
                console.log(`Toggling specialty for ${skillName}`);
                characterData.toggleSpecialty(skillName);
            } else {
                const current = characterData.getSkill(skillName);
                const hasSpecialty = characterData.hasSpecialty(skillName);
                const maxSkill = this.#getSkillMax();
                const minValue = hasSpecialty ? 2 : 0;
                const next = current < maxSkill ? current + 1 : minValue;

                console.log(
                    `Clicking skill ${skillName}: ${current} → ${next} (max: ${maxSkill}, specialty: ${hasSpecialty}, origin: ${characterData.origin})`
                );
                characterData.setSkill(skillName, next);
            }
        } else {
            openD20Popup(skillName);
        }
    }

    #getSkillMax() {
        const origin = characterData.origin;
        return origin === 'superMutant' ? 4 : 6;
    }
}

export class InvDisplay extends DisplayInterface {
    #longPressTimer = null;
    #longPressTarget = null;

    #category2itemsMap = {};

    #rdTypes = {
        physical: 'physical',
        energy: 'energy',
        radiation: 'radiation',
    };

    #getDamageReductionValues() {
        return Object.values(BODY_PARTS).reduce((acc, bodyPart) => {
            acc[bodyPart] = Object.values(this.#rdTypes).reduce((acc2, rdType) => {
                acc2[rdType] = document.getElementById(`apparel__${bodyPart}-${rdType}`);
                return acc2;
            }, {});
            return acc;
        }, {});
    }

    constructor() {
        super('inv-tabContent');

        this.#createCardHolders();

        this._dom = {
            itemCategoryContainers: getDisplayMap(
                Object.values(getDataManager().getItemTypeMap()).flat(),
                '%s-cards'
            ),
            dr: this.#getDrDisplays(),
            subTabButtons: this._rootElement.querySelectorAll('.subTab-button'),
            subScreens: this._rootElement.querySelectorAll('.js-subScreen'),
            damageReductionValues: this.#getDamageReductionValues(),
        };

        this._rootElement.addEventListener('click', e => this.#handleCardClick(e), {
            signal: this._eventController.signal,
        });
        this._rootElement.addEventListener('pointerdown', e => this.#handleCardPointerDown(e), {
            signal: this._eventController.signal,
        });
        this._rootElement.addEventListener('pointerup', () => this.#clearLongPressTimer(), {
            signal: this._eventController.signal,
        });
        this._rootElement.addEventListener('pointerleave', () => this.#clearLongPressTimer(), {
            signal: this._eventController.signal,
        });

        this._onChange('items', () => this.#updateItems());

        // Event listener for inventory sub-tab clicks
        this._dom.subTabButtons.forEach(subTab => {
            subTab.addEventListener(
                'click',
                e => {
                    this.#openSubtab(e.target.closest('.subTab-button'));
                },
                { signal: this._eventController.signal }
            );
        });
    }

    #getDrDisplays() {
        return Object.values(BODY_PARTS).reduce((acc, bp) => {
            acc[bp] = {};
            for (const type of ['physical', 'energy', 'radiation']) {
                acc[bp][type] = document.getElementById(`apparel__${bp}-${type}`);
            }
            return acc;
        }, {});
    }

    #createCardHolders() {
        const tsMap = getDataManager().getItemTypeMap();
        const template = document.getElementById('t-item-carousel-entry');
        for (const type of Object.keys(tsMap)) {
            const typeSection = document.getElementById(`${type}-subScreen`);

            const toKeep = [];
            if (typeSection.classList.contains('keep-first')) {
                toKeep.push(typeSection.firstElementChild);
            }

            typeSection.innerHTML = '';
            toKeep.forEach(el => typeSection.appendChild(el));
            for (const subtype of tsMap[type]) {
                const entryDiv = template.content.cloneNode(true).firstElementChild;
                entryDiv.querySelector('.js-title').dataset.i18n = subtype;
                entryDiv
                    .querySelector('.js-button-addItem')
                    .addEventListener('click', () => openAddItemModal(subtype), {
                        signal: this._eventController.signal,
                    });
                entryDiv.querySelector('.card-carousel').id = `${subtype}-cards`;
                typeSection.appendChild(entryDiv);
                this.#category2itemsMap[subtype] = new Map();
            }
        }
    }

    #openSubtab(subTab) {
        const subScreenId = subTab.dataset.subScreen;
        const targetScreen = `${subScreenId}-subScreen`;

        this._dom.subScreens.forEach(s => s.classList.toggle('hidden', s.id !== targetScreen));
        this._dom.subTabButtons.forEach(t => t.classList.toggle('active', t === subTab));
    }

    #updateItems() {
        requestAnimationFrame(() => {
            // For every item category
            const locationsDr = characterData.getLocationsDR();
            for (const [location, types] of Object.entries(locationsDr)) {
                for (const [type, value] of Object.entries(types)) {
                    this._dom.dr[location][type].textContent = value;
                }
            }

            for (const category of Object.keys(this.#category2itemsMap)) {
                const itemsForCategory = characterData.getItemsByType(category);
                if (category === SKILLS.UNARMED) {
                    itemsForCategory.push({
                        id: 'weaponUnarmedStrike',
                        type: category,
                        quantity: 1,
                    });
                } else if (category === SKILLS.MELEE_WEAPONS) {
                    characterData
                        .getGunBashItems()
                        .forEach(gunBashItem => itemsForCategory.push(gunBashItem));
                }
                const container = this._dom.itemCategoryContainers[category];
                const itemsMap = this.#category2itemsMap[category];
                const newIdSet = new Set(itemsForCategory.map(item => item.id));

                // Remove cards that are no longer in the character's inventory
                for (const id of itemsMap.keys()) {
                    if (!newIdSet.has(id)) {
                        const elementToRemove = itemsMap.get(id);
                        container.removeChild(elementToRemove);
                        itemsMap.delete(id);
                    }
                }

                // Add or update cards
                itemsForCategory.forEach(item => {
                    const isApparel =
                        ['clothing', 'headgear', 'outfit'].includes(item.type) ||
                        item.type.endsWith('Armor');
                    if (!itemsMap.has(item.id)) {
                        let newCard;
                        if (Object.values(SKILLS).includes(item.type)) {
                            newCard = window.cardFactory.createWeaponCard(item);
                        } else if (item.type === 'ammo') {
                            newCard = window.cardFactory.createAmmoEntry(item);
                        } else if (isApparel) {
                            newCard = window.cardFactory.createApparelCard(item);
                        } else {
                            newCard = window.cardFactory.createAidCard(item);
                        }

                        container.appendChild(newCard);
                        itemsMap.set(item.id, newCard);
                    } else {
                        const itemCard = itemsMap.get(item.id);
                        itemCard.querySelector('.card-quantity').textContent = `${item.quantity}x`;
                        const ammoCount = itemCard.querySelector('.js-cardWeapon-ammoCount');
                        if (ammoCount) {
                            ammoCount.textContent = characterData
                                .getItemQuantity(getDataManager().weapon[item.id].AMMO_TYPE)
                                .toString();
                        }
                        if (isApparel) {
                            itemCard.querySelector('.button-card').checked = item.equipped === true;
                        }
                    }
                });
            }
            updateDOM();
        });
    }

    #handleCardClick(e) {
        // If card element pressed does not have a "data-action" set, abort
        const action = e.target.closest('[data-action]')?.dataset?.action;
        if (!action) {
            return;
        }

        const cardDiv = e.target.closest('.card,.ammo-card');
        if (!cardDiv) {
            return;
        }

        const { itemId } = cardDiv.dataset;

        switch (action) {
            case 'toggle-description': {
                const container = cardDiv.querySelector('.description-container');
                const button = cardDiv.querySelector('.description-toggle-button');
                container.classList.toggle('expanded');
                const i18nKey = container.classList.contains('expanded')
                    ? 'close'
                    : 'showDescription';
                button.dataset.i18n = i18nKey;
                button.textContent = t(i18nKey);
                break;
            }
            case 'attack': {
                e.preventDefault();
                const { skill, objectId } = e.target.dataset;
                const attackingItem = getDataManager().getItem(objectId);
                const isGatling = (attackingItem.QUALITIES || []).includes('qualityGatling');
                if (
                    !isMelee(skill) &&
                    characterData.getItemQuantity(attackingItem.AMMO_TYPE) < (isGatling ? 10 : 1)
                ) {
                    alertPopup('notEnoughAmmoAlert');
                } else {
                    openD20Popup(skill, objectId);
                }
                break;
            }
            case 'equip': {
                const { type, objectId } = e.target.dataset;
                const newChecked = e.target.checked;
                characterData.equip(type, objectId, newChecked);
                break;
            }
            case 'delete':
                characterData.removeItem(itemId);
                break;
            case 'sell':
                openSellItemPopup(itemId);
                break;
            case 'cancel-overlay':
                cardDiv.querySelector('.card-overlay').classList.add('hidden');
                break;
        }
    }

    #handleCardPointerDown(e) {
        this.#clearLongPressTimer();
        const cardDiv = e.target.closest('.card,.ammo-card');
        if (cardDiv && !getDataManager().isUnacquirable(cardDiv.dataset.itemId)) {
            this.#longPressTarget = cardDiv;
            this.#longPressTimer = setTimeout(() => {
                const overlay = this.#longPressTarget.querySelector('.card-overlay');
                if (overlay) {
                    overlay.classList.remove('hidden');
                }
            }, 500);
        }
    }

    #clearLongPressTimer() {
        clearTimeout(this.#longPressTimer);
        this.#longPressTimer = null;
        this.#longPressTarget = null;
    }
}

export class DataDisplay extends DisplayInterface {
    constructor() {
        super('data-tabContent');
        this._dom = {
            name: document.getElementById('pg_name'),
            origin: document.getElementById('origin'),
            level: document.getElementById('level'),
            background: document.getElementById('character-background'),
        };

        this._onChangeSetValue('name', this._dom.name);
        this._onChangeSetValue('origin', this._dom.origin);
        this._onChangeSetValue('level', this._dom.level);
        this._onChangeSetText('background', this._dom.background);

        this._dom.name.addEventListener(
            'change',
            e => {
                characterData.name = e.target.value;
            },
            { signal: this._eventController.signal }
        );

        this._dom.origin.addEventListener(
            'change',
            e => {
                characterData.origin = e.target.value;
            },
            { signal: this._eventController.signal }
        );

        this._dom.level.addEventListener(
            'change',
            e => {
                e = Number(e.target.value);
                if (!e) {
                    return;
                }
                characterData.level = e;
            },
            { signal: this._eventController.signal }
        );

        this._dom.background.addEventListener(
            'change',
            e => {
                characterData.background = e.target.value;
            },
            { signal: this._eventController.signal }
        );
    }
}

export class MapDisplay extends DisplayInterface {
    // A variable to hold the Panzoom instance.
    #panzoomInstance = undefined;

    constructor() {
        super('map-tabContent');
        this._dom = {
            mapContainer: document.getElementById('map-container'),
            mapImage: document.getElementById('map-image'),
        };
    }

    /**
     * Sets up the Panzoom instance with the correct options.
     * This function is now called AFTER the map is visible.
     */
    _initializePanzoom() {
        // If a previous instance exists, ensure it's fully disposed of.
        if (this.#panzoomInstance) {
            this._disposePanzoom();
        }

        this.#panzoomInstance = Panzoom(this._dom.mapImage, {
            maxScale: 5,
            startScale: 0.1, // really low zoom, panzoom will use the min zoom allowed
            contain: 'outside',
        });

        // 4. Add the wheel event listener.
        this._dom.mapContainer.addEventListener('wheel', this.#panzoomInstance.zoomWithWheel, {
            signal: this._eventController.signal,
        });
        setTimeout(() => {
            this._centerImage();
        }); // A short delay is usually sufficient.
    }

    /**
     * Calculates the required pan to center the image and applies it.
     */
    _centerImage() {
        const containerRect = this._dom.mapContainer.getBoundingClientRect();
        const imageRect = this._dom.mapImage.getBoundingClientRect();
        const scale = this.#panzoomInstance.getScale();

        // Calculate the visual difference between the container's center and the image's center.
        const deltaX_visual =
            containerRect.width / 2 - (imageRect.left - containerRect.left + imageRect.width / 2);
        const deltaY_visual =
            containerRect.height / 2 - (imageRect.top - containerRect.top + imageRect.height / 2);

        // To get the correct pan values, divide the desired visual movement by the current scale.
        const panX = deltaX_visual / scale;
        const panY = deltaY_visual / scale;

        // Pan by a relative amount to move from the current position to the center.
        this.#panzoomInstance.pan(panX, panY, {
            animate: false,
            relative: true,
        });
    }

    /**
     * This function is called when the user navigates away from the map tab.
     * It cleans up the Panzoom instance to free up resources.
     */
    _disposePanzoom() {
        if (this.#panzoomInstance) {
            this._dom.mapImage.style.transform = '';
            this.#panzoomInstance.destroy();
            this.#panzoomInstance = undefined;
        }
    }
}

export class SettingsDisplay extends DisplayInterface {
    constructor() {
        super('settings-tabContent');
        this._dom = {
            selectorLanguage: document.getElementById('language-select'),
            selectorTheme: document.getElementById('theme-select'),
            buttonReset: document.getElementById('reset-memory-button'),
            buttonDownload: document.getElementById('button-downloadPG'),
            buttonImport: document.getElementById('button-importPG'),
            inputImport: document.getElementById('input-importPG'),
        };
        this._dom.selectorLanguage.addEventListener(
            'change',
            e => {
                const newLang = e.target.value;
                localStorage.setItem('language', newLang);
                changeLanguage();
            },
            { signal: this._eventController.signal }
        );
        this._dom.selectorTheme.addEventListener(
            'change',
            e => {
                const newTheme = e.target.value;
                localStorage.setItem('theme', newTheme);
                changeTheme();
            },
            { signal: this._eventController.signal }
        );

        this._dom.buttonReset.addEventListener(
            'click',
            async () => {
                confirmPopup('deleteCharacterAlert', () => {
                    mainDisplay.dispose();

                    localStorage.clear();
                    alertPopup('dataWipeAlert');
                    // Re-initialize the character to reflect the cleared state
                    changeTheme();
                    changeLanguage();

                    setCharacterData(Character.load());
                    const newMainDisplay = new MainDisplay();
                    setMainDisplay(newMainDisplay);
                    characterData.dispatchAll();
                });
            },
            { signal: this._eventController.signal }
        );

        this._dom.buttonDownload.addEventListener('click', () => this.#downloadCharacter(), {
            signal: this._eventController.signal,
        });

        this._dom.buttonImport.addEventListener('click', () => this._dom.inputImport.click(), {
            signal: this._eventController.signal,
        });
        this._dom.inputImport.addEventListener('change', e => this.#importCharacter(e), {
            signal: this._eventController.signal,
        });
    }

    #downloadCharacter() {
        const dataStr = characterData.toPrettyString();
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${characterData.characterId}_falloutCharacter_backup.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    #importCharacter(event) {
        const file = event.target.files[0];
        if (!file) {
            return; // No file selected
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const characterObject = JSON.parse(e.target.result);
                if (characterObject) {
                    setCharacterData(new Character('default', characterObject));
                    const newMainDisplay = new MainDisplay();
                    setMainDisplay(newMainDisplay);
                    characterData.dispatchAll();
                } else {
                    alertPopup(t('invalidCharacterFileError'));
                }
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alertPopup(t('invalidJsonFileError'));
            }
        };

        reader.onerror = function () {
            alertPopup(t('fileReadError'));
        };

        reader.readAsText(file);
    }
}
