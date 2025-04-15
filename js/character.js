let characterData = undefined;
const defaultCharacter = {
    "level": 1,
    "special": {
        "strength": 5,
        "perception": 5,
        "endurance": 5,
        "charisma": 5,
        "intelligence": 5,
        "agility": 5,
        "luck": 5
    },
    "luckCurrent": 5,
    "currentHp": 11,
    "skills": {
        "athletics": 0,
        "barter": 0,
        "bigGuns": 0,
        "energyWeapons": 0,
        "explosives": 0,
        "lockpick": 0,
        "medicine": 0,
        "meleeWeapons": 0,
        "pilot": 0,
        "repair": 0,
        "science": 0,
        "smallGuns": 0,
        "sneak": 0,
        "speech": 0,
        "survival": 0,
        "throwing": 0,
        "unarmed": 0
    },
    "specialties": [],
    "caps": 0,
    "background": "",

    "items": [],
    "ammo": {},
};

function getItemObj(id, quantity, type){
    return {
        id: id,
        quantity: quantity,
        type: type,
    }
}

class Character {
    #level;
    #special = [];
    #luckCurrent;
    #currentHp;
    #skills = [];
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

        // TODO remove all items, on delete storage the items are still present unless there is a reload
        (JSON.parse(localStorage.getItem("items")) || defaultCharacter.items).forEach(item =>
            this.addItem(item)
        );
        for(const [ammoType, number] of Object.entries(JSON.parse(localStorage.getItem("ammo")) || defaultCharacter.ammo)) {
            this.addAmmo(ammoType, number);
        }

        // TODO fix
        this.#background = localStorage.getItem("background") || defaultCharacter.background;
    }

    getSpecial(special) {
        return this.#special[special];
    }

    setSpecial(special, value) {
        value = Number(value)
        this.#special[special] = value;

        switch (special) {
            case 'strength':
                display.updateMeleeDamage(this);
                display.updateWeight(this);
                break;
            case 'perception':
                display.updateInitiative(this);
                break;
            case 'endurance':
                display.updateHp(this);
                break;
            case 'agility':
                display.updateDefense(this);
                display.updateInitiative(this);
                break;
            case 'luck':
                display.updateHp(this);
                break;
        }
        display.updateSpecial(special, this);
        localStorage.setItem(special, value);
    }

    get currentLuck() {
        return this.#luckCurrent;
    }

    set currentLuck(value) {
        value = Number(value)
        if (value < 0) {
            throw new Error("luck cannot be negative.");
        }
        this.#luckCurrent = value;
        display.updateCurrentLuck(this);
        localStorage.setItem("currentLuck", value);
    }

    get currentHp(){
        return this.#currentHp;
    }

    set currentHp(value){
        value = Number(value)
        this.#currentHp = value;
        display.updateHp(this);
        localStorage.setItem("currentHp", value);
    }

    get level() {
        return this.#level;
    }

    set level(value) {
        value = Number(value)
        this.#level = value;
        display.updateHp(this);
        display.updateLevel(this);
        localStorage.setItem("level", value);
    }

    get caps() {
        return this.#caps;
    }

    set caps(value) {
        value = Number(value)
        this.#caps = value;
        display.updateCaps(this);
        localStorage.setItem("caps", value);
    }

    hasSpecialty(skill) {
        return this.#specialties.indexOf(skill) > -1;
    }

    addSpecialty(skill) {
        if(this.hasSpecialty(skill))
            throw new Error("Can not add "+skill+" specialty, as it is already a specialty.")
        this.#specialties.push(skill);

        const skillValue = this.getSkill(skill)
        this.setSkill(skill, skillValue < 5 ? skillValue + 2 : 6);

        display.updateSpecialty(skill, this);
        localStorage.setItem("specialties", JSON.stringify(this.#specialties));
    }

    removeSpecialty(skill) {
        if(!this.hasSpecialty(skill))
            throw new Error("Can not remove "+skill+" specialty, as it is not a specialty.")
        this.#specialties.splice(this.#specialties.indexOf(skill), 1);

        const skillValue = this.getSkill(skill)
        this.setSkill(skill, skillValue > 1 ? skillValue - 2 : 0);

        display.updateSpecialty(skill, this);
        localStorage.setItem("specialties", JSON.stringify(this.#specialties));
    }

    getSkill(skill) {
        return this.#skills[skill];
    }

    setSkill(skill, value) {
        value = Number(value)
        this.#skills[skill] = value;
        display.updateSkill(skill, this);
        localStorage.setItem(skill, value);
    }

    // Derived attributes;
    get defense() {
        if(this.getSpecial('agility') < 9)
            return 1;
        return 2;
    }

    get initiative() {
        return this.getSpecial('agility') + this.getSpecial('perception');
    }

    get meleeDamage() {
        const strength = this.getSpecial('strength');
        if (strength < 7)
            return 0;
        if(strength < 9)
            return 1;
        if (strength < 11)
            return 2;
        return 3;
    }

    get currentWeight() {
        const bigMap = {
            ...weaponData,
            ...foodData,
            ...drinksData,
            ...medsData
        };
        return this.#items.map(key => bigMap[key.id])
            .map(i => i.WEIGHT)
            .reduce((acc, weight) => {
                const parsed = Number(weight);
                return acc + (isNaN(parsed) ? 0 : parsed) // TODO as WEIGHT=<0.5 was changed to just 0, might not need this anymore
            }, 0);
    }

    get maxWeight() {
        return 75 + this.getSpecial('strength')*5;
    }

    getItemsByType(type) {
        return this.#items.filter(item => item.type === type);
    }

    removeItem(genericItem) {
        const id = genericItem.ID;
        // TODO when mods and extras are implemented, be sure to delete the correct one
        this.#items.find(item => item.id === id).remove();

        display.updateItems(this);
        display.updateWeight(this);
        localStorage.setItem("items", JSON.stringify(this.#items));
    }


    getPrefix(camelCaseString) {
      const match = camelCaseString.match(/[A-Z]/); // Find the first capital letter

      if (match) {
        return camelCaseString.substring(0, match.index); // Extract prefix
      } else {
        return camelCaseString; // No capital letter, return the entire string.
      }
    }

    addItem(item) {
        const id = item.id;
        let type = this.getPrefix(id);
        if(type === "weapon")
            type = weaponData[id].SKILL;
        if(type === "drink")
            type = "drinks";
        // TODO increase quantity instead of inserting a new item
        const currItemData = this.#items.find(i => {
            const keys = Object.keys(i);
            return keys.length === 2 && keys.includes("id") && keys.includes("type") && keys.includes("quantity");
        })
        if(currItemData) {
            currItemData.quantity = Number(currItemData.quantity) + 1;
        } else {
            this.#items.push(getItemObj(id, item.quantity || 1, item.type));
        }

        display.updateItems(this);
        display.updateWeight(this);
        localStorage.setItem("items", JSON.stringify(this.#items));
    }

    addAmmo(ammoType, number) {
        const currentCount = this.#ammo[ammoType] || 0;
        this.#ammo[ammoType] = currentCount + number;
    }

    removeAmmo(ammoType, number) {
        this.addAmmo(ammoType, -number);
    }



    calculateMaxHp(){
        return this.getSpecial('endurance') + this.getSpecial('luck') + this.level; //example calculation.
    }

    static getSpecialList(){
        return Object.keys(defaultCharacter.special);
    }

    static getSkillList(){
        return Object.keys(defaultCharacter.skills);
    }

    static getSkill2SpecialMap(){
        return {
            athletics: "strength",
            barter: "charisma",
            bigGuns: "endurance",
            energyWeapons: "perception",
            explosives: "perception",
            lockpick: "perception",
            medicine: "intelligence",
            meleeWeapons: "strength",
            pilot: "perception",
            repair: "intelligence",
            science: "intelligence",
            smallGuns: "agility",
            sneak: "agility",
            speech: "charisma",
            survival: "endurance",
            throwing: "agility",
            unarmed: "strength",
        };
    }

    static getSpecialFromSkill(skill) {
        return Character.getSkill2SpecialMap()[skill];
    }

}