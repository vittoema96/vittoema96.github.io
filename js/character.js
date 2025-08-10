let characterData = undefined;
const defaultCharacter = {
    "level": 1,
    "special": { "strength": 5, "perception": 5, "endurance": 5, "charisma": 5, "intelligence": 5, "agility": 5, "luck": 5 },
    "currentLuck": 5,
    "currentHp": 11,
    "skills": { "athletics": 0, "barter": 0, "bigGuns": 0, "energyWeapons": 0, "explosives": 0, "lockpick": 0, "medicine": 0, "meleeWeapons": 0, "pilot": 0, "repair": 0, "science": 0, "smallGuns": 0, "sneak": 0, "speech": 0, "survival": 0, "throwing": 0, "unarmed": 0 },
    "specialties": [],
    "caps": 0,
    "background": "",
    "items": [],
    "ammo": {},
};

const CHARACTER_STORAGE_PREFIX = 'character-data-';

class Character extends EventTarget { // TODO check this out
    // All character state is now in a single private object for easy saving.
    #data;
    // Stores the ID for the current character slot.
    #characterId;

    /**
     * The constructor is now simple. It just sets up the state.
     * Use the static Character.load() method to create an instance with saved data.
     * @param {string} characterId - The identifier for the character slot.
     * @param {object} initialData - The character's initial state.
     */
    constructor(characterId, initialData = {}) {
        super();
        this.#characterId = characterId;
        // Deep merge defaults with initial data to prevent missing properties on load.
        this.#data = {
            ...JSON.parse(JSON.stringify(defaultCharacter)),
            ...initialData,
            special: { ...defaultCharacter.special, ...initialData.special },
            skills: { ...defaultCharacter.skills, ...initialData.skills },
        };
    }

    /**
     * Loads character data from localStorage or creates a new one for a given slot.
     * @param {string} characterId - The identifier for the character slot to load.ì
     * @returns {Character} A new Character instance.
     */
    static load(characterId = 'default') {
        const storageKey = `${CHARACTER_STORAGE_PREFIX}${characterId}`;
        const savedDataJSON = localStorage.getItem(storageKey);
        const initialData = savedDataJSON ? JSON.parse(savedDataJSON) : defaultCharacter;

        // Ensure vital stats are correctly initialized if creating a new character.
        if (!savedDataJSON) { // TODO better handling of these 2 initialization (here and on default)
            initialData.luckCurrent = initialData.special.luck;
            initialData.currentHp = initialData.special.endurance + initialData.special.luck + initialData.level;
        }

        return new Character(characterId, initialData);
    }

    /**
     * Saves the character's current state to its slot in localStorage.
     */
    save() {
        const storageKey = `${CHARACTER_STORAGE_PREFIX}${this.#characterId}`;
        localStorage.setItem(storageKey, JSON.stringify(this.#data));
        console.log(`Character data for '${this.#characterId}' saved.`);
    }


    /** TODO check this out
     * Private helper to dispatch events when data changes.
     * The UI layer will listen for these events instead of being called directly.
     * @param {string} type - The type of change (e.g., 'hp', 'inventory').
     * @param {object} detail - Extra data to send with the event.
     */
    #dispatchChange(type, detail) {
        // Dispatch a specific event (e.g., 'change:hp')
        this.dispatchEvent(new CustomEvent(`change:${type}`, { detail }));
        // Dispatch a general 'change' event for broader listeners
        // this.dispatchEvent(new CustomEvent('change', { detail: { type, ...detail } })); TODO this was the original suggested
    }

    getSpecial(special) { return this.#data.special[special]; }
    setSpecial(special, value) {
        this.#data.special[special] = Number(value);
        this.save();
        if(display) display.fullUpdate(this);
    }

    get currentLuck() { return this.#data.currentLuck; }
    set currentLuck(value) {
        this.#data.currentLuck = Number(value);
        this.save();
        if(display) display.updateCurrentLuck(this);
    }

    get currentHp(){ return this.#data.currentHp; }
    set currentHp(value){
        this.#data.currentHp = Number(value);
        this.save();
        if(display) display.updateHp(this);
    }

    get level() { return this.#data.level; }
    set level(value) {
        value = Number(value);
        if(!value) return;

        const diff = value - this.level;
        this.#data.level = value;
        this.#data.currentHp = this.currentHp + diff
        this.save();
        if(display) {
            display.updateHp(this);
            display.updateLevel(this);
        }
    }

    get caps() { return this.#data.caps; }
    set caps(value) {
        value = Number(value);
        if(!value) return;
        this.#data.caps = value;
        this.save();
        if(display) display.updateCaps(this);
    }

    hasSpecialty(skill) { return this.#data.specialties.includes(skill); }
    addSpecialty(skill) {
        if(this.hasSpecialty(skill)) return;
        this.#data.specialties.push(skill);
        const skillValue = this.getSkill(skill);
        this.setSkill(skill, skillValue < 5 ? skillValue + 2 : 6);
        this.save();
        if(display) display.updateSpecialty(skill, this);
    }
    removeSpecialty(skill) {
        if(!this.hasSpecialty(skill)) return;
        this.#data.specialties = this.#data.specialties.filter(s => s !== skill);
        const skillValue = this.getSkill(skill);
        this.setSkill(skill, skillValue > 1 ? skillValue - 2 : 0);
        this.save();
        if(display) display.updateSpecialty(skill, this);
    }

    getSkill(skill) { return this.#data.skills[skill]; }
    setSkill(skill, value) {
        this.#data.skills[skill] = Number(value);
        this.save();
        if(display) display.updateSkill(skill, this);
    }

    get defense() { return this.getSpecial(SPECIAL.AGILITY) < 9 ? 1 : 2; }
    get initiative() { return this.getSpecial(SPECIAL.AGILITY) + this.getSpecial(SPECIAL.PERCEPTION); }
    get meleeDamage() {
        const str = this.getSpecial(SPECIAL.STRENGTH);
        if (str < 7) return 0;
        if (str < 9) return 1;
        if (str < 11) return 2;
        return 3;
    }
    get currentWeight() {
        return this.#data.items.reduce((total, item) => {
            const itemData = getItem(item.id);
            let weight = Number(itemData?.WEIGHT) || 0;
            return total + (weight * (item.quantity || 1));
        }, 0);
    }
    get maxWeight() { return 75 + this.getSpecial(SPECIAL.STRENGTH) * 5; }

    getItem(itemId) { return this.#data.items.find(item => item.id === itemId)}
    getItemQuantity(itemId) { return this.getItem(itemId)?.quantity ?? 1 }
    getItemsByType(type) { return this.#data.items.filter(item => item.type === type); }

    removeItem(itemId, quantity = -Number.MAX_SAFE_INTEGER) {
        const itemIndex = this.#data.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const item = this.#data.items[itemIndex];
        item.quantity -= quantity;
        if (item.quantity <= 0) {
            this.#data.items.splice(itemIndex, 1); // Remove item if quantity is zero or less
        }

        this.save();
        if(display) {
            display.updateItems(this);
            display.updateWeight(this);
        }
    }

    addItem(itemId, itemType, quantity = 1) {
        // TODO implement discerning modded items from normal ones
        const existingItem = this.getItem(itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.#data.items.push({
                id: itemId,
                type: itemType,
                quantity: quantity,
            });
        }
        this.save();
        if(display) {
            display.updateItems(this);
            display.updateWeight(this);
        }
    }

    calculateMaxHp(){ return this.getSpecial(SPECIAL.ENDURANCE) + this.getSpecial(SPECIAL.LUCK) + this.level; }
    static getSpecialList(){ return Object.keys(defaultCharacter.special); }
    static getSkillList(){ return Object.keys(defaultCharacter.skills); }
}

const SPECIAL  = Object.freeze({
    STRENGTH: "strength",
    PERCEPTION: "perception",
    ENDURANCE: "endurance",
    CHARISMA: "charisma",
    INTELLIGENCE: "intelligence",
    AGILITY: "agility",
    LUCK: "luck"
});

const SKILLS = Object.freeze({
    ATHLETICS:      'athletics',
    BARTER:         'barter',
    BIG_GUNS:       'bigGuns',
    ENERGY_WEAPONS: 'energyWeapons',
    EXPLOSIVES:     'explosives',
    LOCKPICK:       'lockpick',
    MEDICINE:       'medicine',
    MELEE_WEAPONS:  'meleeWeapons',
    PILOT:          'pilot',
    REPAIR:         'repair',
    SCIENCE:        'science',
    SMALL_GUNS:     'smallGuns',
    SNEAK:          'sneak',
    SPEECH:         'speech',
    SURVIVAL:       'survival',
    THROWING:       'throwing',
    UNARMED:        'unarmed'
});

const SKILL_TO_SPECIAL_MAP = Object.freeze({
    [SKILLS.ATHLETICS]:      SPECIAL.STRENGTH,
    [SKILLS.BARTER]:         SPECIAL.CHARISMA,
    [SKILLS.BIG_GUNS]:       SPECIAL.ENDURANCE,
    [SKILLS.ENERGY_WEAPONS]: SPECIAL.PERCEPTION,
    [SKILLS.EXPLOSIVES]:     SPECIAL.PERCEPTION,
    [SKILLS.LOCKPICK]:       SPECIAL.PERCEPTION,
    [SKILLS.MEDICINE]:       SPECIAL.INTELLIGENCE,
    [SKILLS.MELEE_WEAPONS]:  SPECIAL.STRENGTH,
    [SKILLS.PILOT]:          SPECIAL.PERCEPTION,
    [SKILLS.REPAIR]:         SPECIAL.INTELLIGENCE,
    [SKILLS.SCIENCE]:        SPECIAL.INTELLIGENCE,
    [SKILLS.SMALL_GUNS]:     SPECIAL.AGILITY,
    [SKILLS.SNEAK]:          SPECIAL.AGILITY,
    [SKILLS.SPEECH]:         SPECIAL.CHARISMA,
    [SKILLS.SURVIVAL]:       SPECIAL.ENDURANCE,
    [SKILLS.THROWING]:       SPECIAL.AGILITY,
    [SKILLS.UNARMED]:        SPECIAL.STRENGTH
});

function isMelee(skill){
    return [SPECIAL.UNARMED, SPECIAL.MELEE_WEAPONS].includes(skill);
}