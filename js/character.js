let characterData = undefined;

// <editor-fold desc="Utils: (SPECIAL, SKILLS, SKILL_TO_SPECIAL_MAP, isMelee(skill), defaultCharacter">
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
    return [SKILLS.UNARMED, SKILLS.MELEE_WEAPONS].includes(skill);
}

const defaultCharacter = {
    "name": null,
    "origin": null,
    "level": 1,
    "special": Object.values(SPECIAL).reduce((acc, key) => {
        acc[key] = 5;
        return acc;
    }, {}),
    "currentLuck": 5,
    "currentHp": 10,
    "skills": Object.values(SKILLS).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {}),
    "specialties": [],
    "caps": 0,
    "background": null,
    "items": []
};
const CHARACTER_STORAGE_PREFIX = 'character-data-';
// </editor-fold>

class Character extends EventTarget {
    #data;
    characterId;

    constructor(id, data){
        super();
        this.characterId = id;
        // Deep merge defaults with initial data to prevent missing properties on load.
        this.#data = {
            ...JSON.parse(JSON.stringify(defaultCharacter)),
            ...data,
            special: { ...defaultCharacter.special, ...data.special },
            skills: { ...defaultCharacter.skills, ...data.skills },
        };
        this.save();
    }

    dispatchAll(){
        Object.values(SPECIAL).forEach(special => this.#dispatchChange(special, this.getSpecial(special)));
        Object.values(SKILLS).forEach(skill => this.#dispatchChange(skill, this.getSkill(skill)));
        this.#dispatchChange("level", this.level);
        this.#dispatchChange("caps", this.caps);

        this.#dispatchChange("currentHp", this.currentHp);
        this.#dispatchChange("currentLuck", this.currentLuck);

        this.#dispatchChange("name", this.name);
        this.#dispatchChange("origin", this.origin);
        this.#dispatchChange("items");
        Object.values(SKILLS).forEach(skill => this.#dispatchChange(`specialty-${skill}`, this.hasSpecialty(skill)));
        this.#dispatchChange("background", this.background);
    }

    #dispatchChange(type, detail = null) {
        this.dispatchEvent(new CustomEvent(`change:${type}`, { detail }));
    }

    get name() { return this.#data.name; }
    set name(value) {
        this.#data.name = value;
        this.save();

        this.#dispatchChange("name", value);
    }

    get origin() { return this.#data.origin; }
    set origin(value) {
        this.#data.origin = value;
        this.save();

        this.#dispatchChange("origin", value);
    }

    get currentHp(){ return this.#data.currentHp; }
    set currentHp(value){
        value = Number(value);
        if(!value && value !== 0) return;

        this.#data.currentHp = value;
        this.save();

        this.#dispatchChange("currentHp", value);
    }
    get maxHp() { return this.getSpecial(SPECIAL.ENDURANCE) + this.getSpecial(SPECIAL.LUCK) + this.level - 1; }
    get caps() { return this.#data.caps; }
    set caps(value) {
        value = Number(value);
        if(!value && value !== 0) return;

        this.#data.caps = value;
        this.save();

        this.#dispatchChange("caps", value);
    }
    get currentWeight() {
        return this.#data.items.reduce((total, item) => {
            const itemData = dataManager.getItem(item.id);
            let weight = Number(itemData?.WEIGHT) || 0;

            // TODO handle items with no quantity (should not happen, check it)
            return total + (weight * (item.quantity || 1));
        }, 0);
    }
    get maxWeight() { return 75 + this.getSpecial(SPECIAL.STRENGTH) * 5; }


    getSpecial(special) { return this.#data.special[special]; }
    setSpecial(special, value) {
        value = Number(value);
        if(!value) return;

        this.#data.special[special] = value;
        this.save();

        this.#dispatchChange(special, value);
    }
    get currentLuck() { return this.#data.currentLuck; }
    set currentLuck(value) {
        value = Number(value);
        if(!value && value !== 0) return;

        this.#data.currentLuck = value;
        this.save();

        this.#dispatchChange("currentLuck", value);
    }

    getSkill(skill) { return this.#data.skills[skill]; }
    setSkill(skill, value) {
        value = Number(value);
        if(!value && value !== 0) return;

        this.#data.skills[skill] = value;
        this.save();

        this.#dispatchChange(skill, value);
    }

    hasSpecialty(skill) { return this.#data.specialties.includes(skill); }
    toggleSpecialty(skill) {
        if(!Object.values(SKILLS).includes(skill)) return;

        let isAdding = true;
        if(this.hasSpecialty(skill)) {
            this.#data.specialties = this.#data.specialties.filter(s => s !== skill);
            isAdding = false;
        } else
            this.#data.specialties.push(skill);

        const skillValue = this.getSkill(skill) + (isAdding ? 2 : -2);

        this.setSkill(skill, skillValue < 0 ? 0 : skillValue > 6 ? 6 : skillValue);
        this.save();

        this.#dispatchChange(`specialty-${skill}`, this.hasSpecialty(skill));
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

        this.#dispatchChange("items", null);
    }
    removeItem(itemId, quantity = Number.MAX_SAFE_INTEGER) {
        const itemIndex = this.#data.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const item = this.#data.items[itemIndex];
        item.quantity -= quantity;
        if (item.quantity <= 0) {
            this.#data.items.splice(itemIndex, 1); // Remove item if quantity is zero or less
        }

        this.save();
        this.#dispatchChange("items", null);
    }
    getItem(itemId) { return this.#data.items.find(item => item.id === itemId)}
    // TODO handle items with no quantity (should not happen, check it)
    getItemQuantity(itemId) { return this.getItem(itemId)?.quantity ?? 0 }
    getItemsByType(type) { return this.#data.items.filter(item => item.type === type); }

    equip(type, itemId, isEquipping){
        if(!isEquipping){
            this.getItem(itemId).equipped = false;
        } else {
            const locations = this.#getCoversLocations(itemId);
            const layers = this.#getCoversLayers(type);
            for(const equippedItem of this.#getEquippedItems()){
                const commonLayers = layers.filter(l => this.#getCoversLayers(equippedItem.type).includes(l))
                if(commonLayers.length > 0){
                    const commonLocations = locations.filter(l => this.#getCoversLocations(equippedItem.id).includes(l))
                    if(commonLocations.length > 0)
                        equippedItem.equipped = false;
                }
            }
            this.getItem(itemId).equipped = true;
        }
        this.#dispatchChange("items", null);
    }

    #getEquippedItems(){
        return this.#data.items.filter(i => i.equipped === true);
    }

    getLocationsDR(){
        const result = Object.values(BODY_PARTS).reduce((acc, bp) => {
            acc[bp] = {
                physical: 0,
                energy: 0,
                radiation: 0
            };
            return acc;
        }, {});
        this.#getEquippedItems().forEach(item => {
            const object = dataManager.apparel[item.id.split("_")[0]];
            const physical = object.PHYSICAL_RES;
            const energy = object.ENERGY_RES;
            const radiation = object.RADIATION_RES;
            const locations = this.#getCoversLocations(item.id);
            for(const location of locations){
                result[location]["physical"] = Math.max(result[location]["physical"], physical);
                result[location]["energy"] = Math.max(result[location]["energy"], energy);
                result[location]["radiation"] = Math.max(result[location]["radiation"], radiation);
            }
        })
        return result;
    }

    #getCoversLocations(itemId){
        let objectId;
        let side;
        [objectId, side] = itemId.split("_");
        const object = dataManager.apparel[objectId];
        const locations = [];
        for (let location of object.LOCATIONS_COVERED) {
            if (location === 'arms') {
                locations.push("leftArm");
                locations.push("rightArm");
            } else if (location === 'legs') {
                locations.push("leftLeg");
                locations.push("rightLeg");
            } else if (location === "arm") {
                locations.push(`${side}Arm`);
            } else if (location === "leg") {
                locations.push(`${side}Leg`);
            } else {
                locations.push(location);
            }
        }
        return locations;
    }
    #getCoversLayers(itemType){
        const result = []
        const isBoth = ["outfit", "headgear"].includes(itemType);
        if(itemType.endsWith("Armor") || isBoth)
            result.push('over');
        if(itemType === "clothing")
            result.push('under');
        return result;
    }


    getGunBashItems() {
        let stock = null;
        let stock2h = null;
        this.#data.items.forEach(item => {
            if(Object.values(SKILLS).includes(item.type)){
                const itemObj = dataManager.weapon[item.id];
                if(itemObj.QUALITIES.includes("qualityTwoHanded")){
                    stock2h = {id: "weaponWeaponStock", type: "meleeWeapons", quantity: 1};
                } else {
                    stock = {id: "weaponWeaponStockOneHanded", type: "meleeWeapons", quantity: 1};
                }
            }
        });
        if(stock && stock2h)
            return [stock, stock2h];
        if(stock) return [stock]
        if(stock2h) return [stock2h]
        return []
    }


    get level() { return this.#data.level; }
    set level(value) {
        value = Number(value);
        if(!value) return;

        const diff = value - this.level;
        this.#data.level = value;
        this.currentHp = this.currentHp + diff
        this.save();

        this.#dispatchChange("level", value);
    }
    get background() { return this.#data.background; }
    set background(content) {
        this.#data.background = content;
        this.save();

        this.#dispatchChange("background", content);
    }


    save() {
        const storageKey = `${CHARACTER_STORAGE_PREFIX}${this.characterId}`;
        localStorage.setItem(storageKey, this.toString());
        console.log(`Character data for '${this.characterId}' saved.`);
    }

     static load(characterId = 'default') {
        const storageKey = `${CHARACTER_STORAGE_PREFIX}${characterId}`;
        const savedDataJSON = localStorage.getItem(storageKey);
        const initialData = savedDataJSON ? JSON.parse(savedDataJSON) : defaultCharacter;

        characterData?.save();
        return new Character(characterId, initialData);
    }


    toString(){
        return JSON.stringify(this.#data);
    }

    toPrettyString(){
        return JSON.stringify(this.#data, null, 2);
    }
}