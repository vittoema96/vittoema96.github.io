let characterData = undefined;
const defaultCharacter = {
    "level": 1,
    "special": { "strength": 5, "perception": 5, "endurance": 5, "charisma": 5, "intelligence": 5, "agility": 5, "luck": 5 },
    "luckCurrent": 5,
    "currentHp": 11,
    "skills": { "athletics": 0, "barter": 0, "bigGuns": 0, "energyWeapons": 0, "explosives": 0, "lockpick": 0, "medicine": 0, "meleeWeapons": 0, "pilot": 0, "repair": 0, "science": 0, "smallGuns": 0, "sneak": 0, "speech": 0, "survival": 0, "throwing": 0, "unarmed": 0 },
    "specialties": [],
    "caps": 0,
    "background": "",
    "items": [],
    "ammo": {},
};

function getItemObj(id, quantity, type){
    return { id: id, quantity: quantity, type: type };
}

class Character {
    #level;
    #special = {};
    #luckCurrent;
    #currentHp;
    #skills = {};
    #specialties = [];
    #caps;
    #items = [];
    #ammo = {};
    #background;

    constructor() {
        this.level = localStorage.getItem("level") || defaultCharacter.level;
        Character.getSpecialList().forEach(special =>
            this.setSpecial(special, localStorage.getItem(special) || defaultCharacter.special[special])
        );
        this.currentLuck = localStorage.getItem("currentLuck") || this.#special.luck;
        this.currentHp = localStorage.getItem("currentHp") || this.calculateMaxHp();
        Character.getSkillList().forEach(skill =>
            this.setSkill(skill, localStorage.getItem(skill) || defaultCharacter.skills[skill])
        );
        (JSON.parse(localStorage.getItem("specialties")) || defaultCharacter.specialties).forEach(specialty =>
            this.addSpecialty(specialty)
        );
        this.caps = localStorage.getItem("caps") || defaultCharacter.caps;

        this.#items = JSON.parse(localStorage.getItem("items")) || defaultCharacter.items;
        this.#ammo = JSON.parse(localStorage.getItem("ammo")) || defaultCharacter.ammo;
        this.#background = localStorage.getItem("background") || defaultCharacter.background;
    }

    getSpecial(special) { return this.#special[special]; }
    setSpecial(special, value) {
        value = Number(value);
        this.#special[special] = value;
        localStorage.setItem(special, value);
        if(display) display.fullUpdate(this);
    }

    get currentLuck() { return this.#luckCurrent; }
    set currentLuck(value) {
        value = Number(value);
        this.#luckCurrent = Math.max(0, value);
        localStorage.setItem("currentLuck", this.#luckCurrent);
        if(display) display.updateCurrentLuck(this);
    }

    get currentHp(){ return this.#currentHp; }
    set currentHp(value){
        value = Number(value);
        this.#currentHp = value;
        localStorage.setItem("currentHp", value);
        if(display) display.updateHp(this);
    }

    get level() { return this.#level; }
    set level(value) {
        value = Number(value);
        this.#level = value;
        localStorage.setItem("level", value);
        if(display) {
            display.updateHp(this);
            display.updateLevel(this);
        }
    }

    get caps() { return this.#caps; }
    set caps(value) {
        value = Number(value);
        this.#caps = value;
        localStorage.setItem("caps", value);
        if(display) display.updateCaps(this);
    }

    hasSpecialty(skill) { return this.#specialties.includes(skill); }
    addSpecialty(skill) {
        if(this.hasSpecialty(skill)) return;
        this.#specialties.push(skill);
        const skillValue = this.getSkill(skill);
        this.setSkill(skill, skillValue < 5 ? skillValue + 2 : 6);
        localStorage.setItem("specialties", JSON.stringify(this.#specialties));
        if(display) display.updateSpecialty(skill, this);
    }
    removeSpecialty(skill) {
        if(!this.hasSpecialty(skill)) return;
        this.#specialties = this.#specialties.filter(s => s !== skill);
        const skillValue = this.getSkill(skill);
        this.setSkill(skill, skillValue > 1 ? skillValue - 2 : 0);
        localStorage.setItem("specialties", JSON.stringify(this.#specialties));
        if(display) display.updateSpecialty(skill, this);
    }

    getSkill(skill) { return this.#skills[skill]; }
    setSkill(skill, value) {
        value = Number(value);
        this.#skills[skill] = value;
        localStorage.setItem(skill, value);
        if(display) display.updateSkill(skill, this);
    }

    get defense() { return this.getSpecial('agility') < 9 ? 1 : 2; }
    get initiative() { return this.getSpecial('agility') + this.getSpecial('perception'); }
    get meleeDamage() {
        const str = this.getSpecial('strength');
        if (str < 7) return 0;
        if (str < 9) return 1;
        if (str < 11) return 2;
        return 3;
    }
    get currentWeight() {
        const allItemsData = { ...weaponData, ...foodData, ...drinksData, ...medsData };
        return this.#items.reduce((total, item) => {
            const itemData = allItemsData[item.id];
            const weight = itemData ? Number(itemData.WEIGHT) : 0;
            return total + (isNaN(weight) ? 0 : weight * item.quantity);
        }, 0);
    }
    get maxWeight() { return 75 + this.getSpecial('strength') * 5; }

    getItemsByType(type) { return this.#items.filter(item => item.type === type); }

    removeItem(itemToRemove) {
        const index = this.#items.findIndex(item => item.id === itemToRemove.ID);
        if (index > -1) {
            this.#items.splice(index, 1);
            localStorage.setItem("items", JSON.stringify(this.#items));
            if(display) {
                display.updateItems(this);
                display.updateWeight(this);
            }
        }
    }

    addItem(itemId, itemType, quantity) {
        // TODO implement discerning modded items from normal ones
        const existingItem = this.#items.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.quantity += (quantity || 1);
        } else {
            this.#items.push({
                id: itemId,
                type: itemType,
                quantity: quantity || 1,
            });
        }
        localStorage.setItem("items", JSON.stringify(this.#items));
        if(display) {
            display.updateItems(this);
            display.updateWeight(this);
        }
    }

    calculateMaxHp(){ return this.getSpecial('endurance') + this.getSpecial('luck') + this.level; }
    static getSpecialList(){ return Object.keys(defaultCharacter.special); }
    static getSkillList(){ return Object.keys(defaultCharacter.skills); }
    static getSkill2SpecialMap(){ return { athletics: "strength", barter: "charisma", bigGuns: "endurance", energyWeapons: "perception", explosives: "perception", lockpick: "perception", medicine: "intelligence", meleeWeapons: "strength", pilot: "perception", repair: "intelligence", science: "intelligence", smallGuns: "agility", sneak: "agility", speech: "charisma", survival: "endurance", throwing: "agility", unarmed: "strength" }; }
    static getSpecialFromSkill(skill) { return Character.getSkill2SpecialMap()[skill]; }
}