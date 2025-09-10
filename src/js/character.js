import { SPECIAL, SKILLS } from './constants.js';
import * as GameRules from './gameRules.js';
import { isMelee } from './gameRules.js';
import { saveCharacter, loadCharacterData } from './characterRepository.js';

export class Character extends EventTarget {
    #data;
    #proxy;
    characterId;

    constructor(id, initialData) {
        super();
        this.characterId = id;
        this.#data = initialData;

        // The Proxy intercepts any change to the data object.
        this.#proxy = new Proxy(this.#data, {
            set: (target, property, value) => {
                target[property] = value;
                saveCharacter(this.characterId, this.#data);
                this.dispatchEvent(new CustomEvent(`change:${property}`, { detail: value }));

                // For properties that affect other properties (like SPECIAL affecting skills)
                // you might dispatch additional events here.

                return true;
            },
        });
    }

    // Static factory method to load a character
    static load(characterId = 'default') {
        const data = loadCharacterData(characterId);
        return new Character(characterId, data);
    }

    get data() {
        return this.#proxy;
    }

    // Basic property getters and setters
    get name() {
        return this.#data.name;
    }
    set name(value) {
        this.data.name = value;
    } // Uses proxy

    get origin() {
        return this.#data.origin;
    }
    set origin(value) {
        this.data.origin = value;
    } // Uses proxy

    get level() {
        return this.#data.level;
    }
    set level(value) {
        const numValue = Number(value);
        if (!numValue || numValue < 1) {
            return;
        }
        const diff = numValue - this.level;
        this.data.level = numValue; // Uses proxy
        this.currentHp = this.currentHp + diff; // Level up HP bonus
    }

    get caps() {
        return this.#data.caps;
    }
    set caps(value) {
        const numValue = Number(value);
        if (numValue < 0) {
            return;
        }
        this.data.caps = numValue; // Uses proxy
    }

    get currentHp() {
        return this.#data.currentHp;
    }
    set currentHp(value) {
        const numValue = Number(value);
        if (numValue < 0) {
            return;
        }
        this.data.currentHp = numValue; // Uses proxy
    }

    get currentLuck() {
        return this.#data.currentLuck;
    }
    set currentLuck(value) {
        const numValue = Number(value);
        if (numValue < 0) {
            return;
        }
        this.data.currentLuck = numValue;
    }

    get background() {
        return this.#data.background;
    }
    set background(value) {
        this.data.background = value;
    }

    // Derived stats using GameRules
    get maxHp() {
        return GameRules.getMaxHp(this.#data);
    }

    get defense() {
        return GameRules.getDefense(this.#data);
    }

    get initiative() {
        return GameRules.getInitiative(this.#data);
    }

    get meleeDamage() {
        return GameRules.getMeleeDamage(this.#data);
    }

    get maxWeight() {
        return GameRules.getMaxWeight(this.#data);
    }

    get currentWeight() {
        // This needs dataManager to calculate, so we'll get it from window for now
        return GameRules.getCurrentWeight(this.#data, window.dataManager);
    }

    getLocationsDR() {
        // This needs dataManager to calculate, so we'll get it from window for now
        return GameRules.getLocationsDR(this.#data, window.dataManager);
    }

    getGunBashItems() {
        // Get guns that can be used as melee weapons (gun bashing)
        const dataManager = window.dataManager;
        const gunBashItems = [];

        // Find all guns the character owns
        this.#data.items.forEach(item => {
            const itemData = dataManager.getItem(item.id);
            if (itemData && dataManager.isType(item.type, 'weapon') && !isMelee(item.type)) {
                // This is a ranged weapon that can be used for gun bashing
                // Create weapon stock items for melee use
                const qualities = itemData.QUALITIES || [];
                const isTwoHanded = qualities.includes('qualityTwoHanded');

                gunBashItems.push({
                    id: isTwoHanded ? 'weaponWeaponStock' : 'weaponWeaponStockOneHanded',
                    type: SKILLS.MELEE_WEAPONS,
                    quantity: item.quantity,
                    originalWeapon: item.id,
                });
            }
        });

        return gunBashItems;
    }

    // Methods defined below to avoid duplicates

    addItem(itemId, itemType, quantity = 1) {
        const existingItem = this.data.items.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.data.items.push({ id: itemId, type: itemType, quantity });
        }

        // Manually trigger save/dispatch for nested object changes
        this.data.items = [...this.data.items];
    }

    removeItem(itemId, quantity = Number.MAX_SAFE_INTEGER) {
        const itemIndex = this.data.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) {
            return;
        }

        const item = this.data.items[itemIndex];
        item.quantity -= quantity;
        if (item.quantity <= 0) {
            this.data.items.splice(itemIndex, 1);
        }

        // Trigger proxy update
        this.data.items = [...this.data.items];
    }

    getItem(itemId) {
        return this.#data.items.find(item => item.id === itemId);
    }

    getItemQuantity(itemId) {
        return this.getItem(itemId)?.quantity ?? 0;
    }

    getItemsByType(type) {
        return this.#data.items.filter(item => item.type === type);
    }

    // SPECIAL attribute methods
    getSpecial(special) {
        return this.#data.special[special];
    }

    setSpecial(special, value) {
        const numValue = Number(value);
        const maxValue = this.getSpecialMax(special);
        if (!numValue || numValue < 1 || numValue > maxValue) {
            return;
        }
        this.#data.special[special] = numValue;
        saveCharacter(this.characterId, this.#data);
        this.dispatchEvent(new CustomEvent(`change:${special}`, { detail: numValue }));
    }

    // Skills methods
    getSkill(skill) {
        return this.#data.skills[skill];
    }

    setSkill(skill, value) {
        const numValue = Number(value);
        const maxValue = this.getSkillMax();
        if (numValue < 0 || numValue > maxValue) {
            return;
        }
        this.#data.skills[skill] = numValue;
        saveCharacter(this.characterId, this.#data);
        this.dispatchEvent(new CustomEvent(`change:${skill}`, { detail: numValue }));
    }

    // Specialties methods
    hasSpecialty(skill) {
        return this.#data.specialties.includes(skill);
    }

    toggleSpecialty(skill) {
        if (!Object.values(SKILLS).includes(skill)) {
            return;
        }

        let isAdding = true;
        if (this.hasSpecialty(skill)) {
            this.#data.specialties = this.#data.specialties.filter(s => s !== skill);
            isAdding = false;
        } else {
            this.#data.specialties = [...this.#data.specialties, skill];
        }

        // Update skill value first
        const skillValue = this.getSkill(skill) + (isAdding ? 2 : -2);
        const maxSkill = this.getSkillMax();
        this.setSkill(skill, Math.max(0, Math.min(skillValue, maxSkill)));

        // Then save and dispatch specialty change event with current state
        saveCharacter(this.characterId, this.#data);
        this.dispatchEvent(
            new CustomEvent(`change:specialty-${skill}`, { detail: this.hasSpecialty(skill) })
        );
    }

    // Origin-based maximum values
    getSpecialMax(special) {
        const origin = this.#data.origin;

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

    getSkillMax() {
        const origin = this.#data.origin;
        return origin === 'superMutant' ? 4 : 6;
    }

    // Event system
    dispatchAll() {
        Object.values(SPECIAL).forEach(special =>
            this.dispatchEvent(
                new CustomEvent(`change:${special}`, { detail: this.getSpecial(special) })
            )
        );
        Object.values(SKILLS).forEach(skill =>
            this.dispatchEvent(new CustomEvent(`change:${skill}`, { detail: this.getSkill(skill) }))
        );

        this.dispatchEvent(new CustomEvent('change:level', { detail: this.data.level }));
        this.dispatchEvent(new CustomEvent('change:caps', { detail: this.data.caps }));
        this.dispatchEvent(new CustomEvent('change:currentHp', { detail: this.data.currentHp }));
        this.dispatchEvent(
            new CustomEvent('change:currentLuck', { detail: this.data.currentLuck })
        );
        this.dispatchEvent(new CustomEvent('change:name', { detail: this.data.name }));
        this.dispatchEvent(new CustomEvent('change:origin', { detail: this.data.origin }));
        this.dispatchEvent(new CustomEvent('change:background', { detail: this.data.background }));
        this.dispatchEvent(new CustomEvent('change:items'));

        Object.values(SKILLS).forEach(skill =>
            this.dispatchEvent(
                new CustomEvent(`change:specialty-${skill}`, { detail: this.hasSpecialty(skill) })
            )
        );
    }

    toString() {
        return JSON.stringify(this.#data);
    }

    toPrettyString() {
        return JSON.stringify(this.#data, null, 2);
    }
}

// Global character data - will be managed by external service
export let characterData = undefined;

// Helper function to update the global character data
export const setCharacterData = newCharacterData => {
    characterData = newCharacterData;
};
