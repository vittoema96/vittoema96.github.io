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
    "hpCurrent": 11,
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
    "weapons": [],
    "ammo": {},
    "food": [],
    "drinks": [],
    "meds": []
};

function getItemObj(id, quantity, type, extra){
    return {
        id: id,
        quantity: quantity,
        type: type,
        extra: extra
    }
}

class Character {
    #level;
    #special = [];
    #luckCurrent;
    #hpCurrent;
    #skills = [];
    #specialties = [];
    #caps;
    #items = [];
    #background;

    constructor(data) {
        let parsedData;
        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
            } catch (error) {
                console.error("Error parsing character data from localStorage:", error);
                parsedData = defaultCharacter; // Use default if parsing fails
            }
        } else {
            parsedData = data || defaultCharacter;
        }

        this.level = parsedData.level || defaultCharacter.level;
        Character.getSpecialList().forEach(special =>
            this.setSpecial(special, parsedData.special[special] || defaultCharacter.special[special])
        );
        this.currentLuck = parsedData.luckCurrent || this.#special.luck;

        this.hpCurrent = parsedData.hpCurrent || this.calculateMaxHp();

        Character.getSkillList().forEach(skill =>
            this.setSkill(skill, parsedData.skills[skill] || defaultCharacter.skills[skill])
        );
        (parsedData.specialties || defaultCharacter.specialties).forEach(specialty =>
            this.addSpecialty(specialty)
        );
        this.caps = parsedData.caps || defaultCharacter.caps;
        (parsedData.items || defaultCharacter.items).forEach(item =>
            this.addItem(item)
        );
        this.#background = parsedData.background || defaultCharacter.background;
    }

    getSpecial(special) {
        return this.#special[special];
    }

    setSpecial(special, value) {
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
    }

    get currentLuck() {
        return this.#luckCurrent;
    }

    set currentLuck(value) {
        if (value < 0) {
            throw new Error("luck cannot be negative.");
        }
        this.#luckCurrent = value;
        display.updateCurrentLuck(this);
    }

    get hpCurrent(){
        return this.#hpCurrent;
    }

    set hpCurrent(value){
        this.#hpCurrent = value;
        // TODO update display
    }

    get level() {
        return this.#level;
    }

    set level(value) {
        this.#level = value;
        display.updateHp(this);
        display.updateLevel(this);
    }

    get caps() {
        return this.#level;
    }

    set caps(value) {
        this.#caps = value;
        display.updateCaps(this);
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
    }

    removeSpecialty(skill) {
        if(!this.hasSpecialty(skill))
            throw new Error("Can not remove "+skill+" specialty, as it is not a specialty.")
        this.#specialties.splice(this.#specialties.indexOf(skill), 1);

        const skillValue = this.getSkill(skill)
        this.setSkill(skill, skillValue > 1 ? skillValue - 2 : 0);

        display.updateSpecialty(skill, this);
    }

    getSkill(skill) {
        return this.#skills[skill];
    }

    setSkill(skill, value) {
        this.#skills[skill] = value;
        display.updateSkill(skill, this);
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
    }


    getPrefix(camelCaseString) {
      const match = camelCaseString.match(/[A-Z]/); // Find the first capital letter

      if (match) {
        return camelCaseString.substring(0, match.index); // Extract prefix
      } else {
        return camelCaseString; // No capital letter, return the entire string.
      }
    }

    addItem(genericItem) {
        let type = this.getPrefix(genericItem);
        if(type === "weapon")
            type = weaponData[genericItem].SKILL;
        // TODO increase quantity instead of inserting a new item
        this.#items.push(getItemObj(genericItem, 1, type, ""));

        display.updateItems(this);
        display.updateWeight(this);
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

    toString(){
        let result = {
            "level": this.level,
            "special": {},
            "luckCurrent": this.currentLuck,
            "hpCurrent": this.hpCurrent,
            "skills": {},
            "specialties": this.#specialties,
            "caps": this.caps,
            "background": this.#background,

            "items": this.#items,
        };
        Character.getSpecialList().forEach((item) => {
            result.special[item] = this.getSpecial(item);
        });
        Character.getSkillList().forEach((item) => {
            result.skills[item] = this.getSkill(item);
        });
        return result;
    }

}