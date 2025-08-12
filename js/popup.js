
class StatAdjustementPopup {

    static #htmlElement = document.getElementById('popup-editHeaderStats');
    static #trigger = document.getElementById('c-headerStats');

    static #dom ={
        hpOld: document.getElementById("adjustHpOld"),
        hpNew: document.getElementById("adjustHpNew"),

        capsOld: document.getElementById("adjustCapsOld"),
        capsNew: document.getElementById("adjustCapsNew"),

        luckOld: document.getElementById("adjustLuckOld"),
        luckNew: document.getElementById("adjustLuckNew"),
    }

    #currentHp;
    #caps;
    #currentLuck;

    constructor() {
        StatAdjustementPopup.#trigger.addEventListener('click', () => this.openPopup())
        StatAdjustementPopup.#dom.hpNew.addEventListener('change', (e) => {
            this.#currentHp = e.target.value;
        });
        StatAdjustementPopup.#dom.capsNew.addEventListener('change', (e) => {
            this.#caps = e.target.value;
        });
        StatAdjustementPopup.#dom.luckNew.addEventListener('change', (e) => {
            this.#currentLuck = e.target.value;
        });
        StatAdjustementPopup.#htmlElement.addEventListener('click', (e) => {
            if(e.target.closest('.confirm-button')){
                let errorString = "";
                const errorHeader = "Qualcosa è andato storto:\n";
                if(this.#currentHp < 0 || this.#currentHp > characterData.calculateMaxHp())
                    errorString += "\n- HP non validi";
                if(this.#caps < 0)
                    errorString += "\n- Tappi non validi";
                if(this.#currentLuck < 0 || this.#currentLuck > characterData.getSpecial(SPECIAL.LUCK))
                    errorString += "\n- Fortuna non valida";

                if(errorString !== "")
                    showNotification(`${errorHeader}${errorString}`);
                else {
                    characterData.currentHp = this.#currentHp;
                    characterData.caps = this.#caps;
                    characterData.currentLuck = this.#currentLuck;
                    closeActivePopup();
                }
            }
        });
    }

    openPopup(){
        this.#initialize();
        StatAdjustementPopup.#htmlElement.showModal();
    }

    #initialize(){
        const currentHp = characterData.currentHp;
        this.#currentHp = currentHp;
        StatAdjustementPopup.#dom.hpOld.textContent = `${currentHp}/${characterData.calculateMaxHp()}`;

        const caps = characterData.caps;
        this.#caps = caps;
        StatAdjustementPopup.#dom.capsOld.textContent = caps;

        const currentLuck = characterData.currentLuck;
        this.#currentLuck = currentLuck;
        StatAdjustementPopup.#dom.luckOld.textContent = `${currentLuck}/${characterData.getSpecial(SPECIAL.LUCK)}`;

        this.#render();
    }

    #render(){
        StatAdjustementPopup.#dom.hpNew.value = this.#currentHp;
        StatAdjustementPopup.#dom.capsNew.value = this.#caps;
        StatAdjustementPopup.#dom.luckNew.value = this.#currentLuck;
    }
}

class TradeItemPopup {
    
    static #htmlElement = document.getElementById('popup-tradeItem');
    
    static #dom = {
        type: document.getElementById('tradeType'),
        quantity: document.getElementById('tradeQuantity'),
        price: document.getElementById('tradePrice'),
        total: document.getElementById('tradeTotal'),
        confirm: TradeItemPopup.#htmlElement.querySelector(".confirm-button")
    }
    
    constructor(){
        TradeItemPopup.#htmlElement.addEventListener('click', (e) => {
            if(e.target.closest('.confirm-button')){
                // TODO somethings wrong here
                if(characterData.getItemQuantity(this.#itemId))
                characterData.caps += TradeItemPopup.#dom.total.textContent;
                characterData.removeItem(this.#itemId, TradeItemPopup.#dom.quantity.value);
                // TODO check for selling too many items
                closeActivePopup();
            }
        });
        TradeItemPopup.#dom.quantity.addEventListener('change', (e) => {
            this.#tradeQuantity = e.target.value;
            this.#render();
        });
        TradeItemPopup.#dom.price.addEventListener('change', (e) => {
            this.#tradePrice = e.target.value;
            this.#render();
        });
    }

    #isBuy;
    #itemId;
    #tradeQuantity;
    #tradePrice;
    get #tradeValueRate () { return this.#isBuy ? 6/5 : 4/5 }
    
    openPopup(itemId, isBuy){
        this.#initialize(itemId, isBuy);
        this.#render();
        TradeItemPopup.#htmlElement.showModal();
    }

    #initialize(itemId, isBuy){
        this.#isBuy = !!isBuy;
        this.#itemId = itemId;
        if(this.#isBuy){
            this.#tradeQuantity = 1;
        } else {
            this.#tradeQuantity = characterData.getItemQuantity(this.#itemId) || 1;
            TradeItemPopup.#dom.quantity.max = this.#tradeQuantity;
        }
        let price = dataManager.getItem(this.#itemId).COST || 1; // Get normal item price
        price = price * this.#tradeValueRate; // Apply trade rate
        price  = Math.round(price*100)/100; // Round decimals
        this.#tradePrice = price;
    }
    
    #render(){
        TradeItemPopup.#dom.type.textContent = translator.translate(this.#isBuy ? "buying" : "selling");
        TradeItemPopup.#dom.quantity.value = this.#tradeQuantity;
        TradeItemPopup.#dom.price.value = this.#tradePrice;
        TradeItemPopup.#dom.total.textContent = (Math.floor(this.#tradeQuantity * this.#tradePrice)).toString();
    }
    
}

class TagTooltip {

    static container = document.getElementById('tooltip-container');
    #arrow = document.getElementById("arrow");

    #activeTag;

    constructor(){
        document.body.addEventListener('mouseover', (event) => {
            if(event.target.matches('.tag')){
                this.openTooltip(event.target);
            }
        });
        document.body.addEventListener('mouseout', (event) => {
            if(event.target.matches('.tag')){
                this.hideTooltip();
            }
        });
        // Hide tooltip if clicking outside an active tag
        document.addEventListener('click', (e) => {
            if (this.#activeTag &&
                !this.#activeTag.contains(e.target) &&
                !TagTooltip.container.contains(e.target)) {
                this.hideTooltip();
            }
        });

        // Touch events for mobile (toggle behavior)
        document.addEventListener('touchstart', (e) => {
            const touchedTag = e.target.closest('.tag');

            if (touchedTag) {
                e.preventDefault();
                // If tapping the same tag that's already active, hide it.
                if (this.#activeTag === touchedTag) {
                    this.hideTooltip();
                } else { // If another tooltip is open, hide it first.
                    if (this.#activeTag) {
                       this.hideTooltip();
                    }
                    this.openTooltip(touchedTag);
                }
            } else if (this.#activeTag && !TagTooltip.container.contains(e.target)) {
                // If tapping outside an active tag and the tooltip, hide it.
                this.hideTooltip();
            }
        }, { passive: false });

        // Hide tooltip if clicking outside an active tag
        document.addEventListener('click', (e) => {
            if (this.#activeTag && !this.#activeTag.contains(e.target)) {
                this.hideTooltip();
            }
        });
    }

    openTooltip(tagEl){
        if (!tagEl) return;

        // Get the tooltip text from the data attribute
        const tooltipText = translator.translate(tagEl.dataset.tooltipId);
        if (!tooltipText) return;

        const parentDialog = tagEl.closest('dialog[open]');
        if (parentDialog) {
            parentDialog.appendChild(TagTooltip.container);
        }

        this.#activeTag = tagEl;

        // Set the text and make it visible
        TagTooltip.container.textContent = tooltipText;

        this.#arrow = document.createElement('div');
        this.#arrow.className = 'tooltip-arrow';
        TagTooltip.container.appendChild(this.#arrow); // Re-add arrow
        TagTooltip.container.classList.add('visible');

        // Position the tooltip
        this.#positionTooltip(tagEl);
    }

    #positionTooltip (tagEl) {
        const tagRect = tagEl.getBoundingClientRect();
        const tooltipRect = TagTooltip.container.getBoundingClientRect();

        const spacing = 12; // Space between the tag and the tooltip
        let top, left;

        // Default position is above the tag
        TagTooltip.container.className = 'tooltip-panel visible pos-top';

        const dialogRect = tagEl.closest('dialog[open]')?.getBoundingClientRect();
        const dialogTop = dialogRect?.top || 0;
        const dialogLeft = dialogRect?.left || 0;
        top = tagRect.top - tooltipRect.height - spacing;
        left = tagRect.left + (tagRect.width / 2) - (tooltipRect.width / 2);

        // If it goes off the top of the screen, place it below instead
        if (top < 0) {
            TagTooltip.container.className = 'tooltip-panel visible pos-bottom';
            top = tagRect.bottom + spacing;
        }

        // Prevent it from going off the left/right edges
        let diff = 0;
        if (left < 0) {
            diff = left;
            left = spacing;
            diff = diff - left;
        } else if (left + tooltipRect.width > window.innerWidth) {
            diff = left;
            left = window.innerWidth - tooltipRect.width - spacing;
            diff = diff - left;
        }

        if(diff){
            diff = diff > 0 ? diff = `+ ${diff}px` : `- ${-diff}px`;
            this.#arrow.style.transform = `translateX(calc(-50% ${diff}))`;
        } else {
            this.#arrow.style.transform = `translateX(-50%)`;
        }

        TagTooltip.container.style.top = `${top - dialogTop}px`;
        TagTooltip.container.style.left = `${left - dialogLeft}px`;
    };

    hideTooltip() {
        this.#activeTag = null;
        // KEY CHANGE: Move tooltip back to the body to reset it for non-dialog tags.
        if (TagTooltip.container.parentElement !== document.body) {
            document.body.appendChild(TagTooltip.container);
        }

        TagTooltip.container.classList.remove('visible');
    };
}

class D20Popup {

    static #htmlElement = document.getElementById('popup-d20');
    static #dom = {
        skillTitle: document.getElementById('popup-d20__skillTitle'),

        specialSelector: document.getElementById('popup-d20__selector-special'),
        luckCheckbox: document.getElementById('popup-d20__checkbox-luck'),

        targetNumber: document.getElementById('popup-d20-target'),
        targetNumberBreakdown: document.getElementById('popup-d20-target-breakdown'),
        critBreakdown: document.getElementById('popup-d20-crit-breakdown'),

        dice: this.#htmlElement.querySelectorAll('.d20-dice'),

        apCost: document.getElementById('popup-d20-ap-cost'),
        aimCheckbox: document.getElementById('popup-d20-aim-checkbox'),
        payedLuck: document.getElementById('popup-d20-payed-luck'),
        luckCost: document.getElementById('popup-d20-luck-cost'),

        successesDisplay: document.getElementById('popup-d20-successes-display'),

        rollButton: document.getElementById('popup-d20-roll-button'),
        damageButton: document.getElementById('popup-d20-damage-button'),
    };

    constructor() {
        D20Popup.#dom.specialSelector.addEventListener('change', (event) => {
            this.#specialId = event.target.value;
            this.#render();
        });
        D20Popup.#dom.luckCheckbox.addEventListener('change', (event) => {
            this.#isUsingLuck = event.target.checked;
            this.#render();
        });
        D20Popup.#dom.dice.forEach((dice, index) => {
            dice.addEventListener('click', () => {
                this.#onDiceClick(index);
            });
        });
        D20Popup.#dom.aimCheckbox.addEventListener('change', (event) => {
            this.#isAiming = event.target.checked;
            this.#render();
        });
        D20Popup.#dom.damageButton.addEventListener('click', () => {
            closeActivePopup(); // FIXME
            openD6Popup(this.#objectId);
        });
        D20Popup.#dom.rollButton.addEventListener('click', () => this.#onRoll());
    }

    #character;

    #objectId;
    #isObjectInaccurate;
    #isObjectUnreliable;
    #hasRolled;
    #skillId;
    #specialId;
    #isUsingLuck ;
    #isAiming ;

    #diceContent;
    #diceActive;
    #diceRerolled;

    open(skillId, objectId){
        this.#initialize(skillId, objectId);
        D20Popup.#htmlElement.showModal();
    }

    #initialize(skillId, objectId){
        this.#character = characterData;

        this.#objectId = objectId;

        const object = dataManager.getItem(objectId);
        this.#isObjectInaccurate = (object?.QUALITIES || []).includes("qualityInaccurate");
        this.#isObjectUnreliable = (object?.QUALITIES || []).includes("qualityUnreliable");

        // If inaccurate strikethrough "Aim?"
        const aimText = D20Popup.#htmlElement.querySelector('[data-lang-id="aim"]');
        if(this.#isObjectInaccurate){ aimText.style.textDecoration = "line-through"; }
        else { aimText.style.textDecoration = "initial"; }

        this.#hasRolled = false;
        this.#skillId = skillId;
        this.#specialId = SKILL_TO_SPECIAL_MAP[skillId];
        this.#isUsingLuck = false;
        this.#isAiming = false;

        this.#diceContent = Array(5).fill('?');
        this.#diceActive = [true, true, false, false, false];
        this.#diceRerolled = Array(5).fill(false);

        this.#render();
    }

    #render() {
        const skillName = translator.translate(this.#skillId);
        D20Popup.#dom.skillTitle.textContent = skillName;
        D20Popup.#dom.skillTitle.style.fontSize = getVariableFontSize(skillName);

        const activeSpecialId = this.#isUsingLuck ? SPECIAL.LUCK : this.#specialId;
        D20Popup.#dom.specialSelector.value = activeSpecialId;
        D20Popup.#dom.specialSelector.disabled = this.#hasRolled || this.#isUsingLuck;

        D20Popup.#dom.luckCheckbox.checked = this.#isUsingLuck;
        D20Popup.#dom.luckCheckbox.disabled = this.#hasRolled;

        const skillVal = this.#character.getSkill(this.#skillId);
        const specialVal = this.#character.getSpecial(activeSpecialId);
        const targetVal = skillVal + specialVal;
        const isSpecialty = this.#character.hasSpecialty(this.#skillId);
        const critVal = isSpecialty ? skillVal : 1;
        // TODO language (Target, Skill, Critical Hit, etc...)
        D20Popup.#dom.targetNumber.textContent = `Target: ${targetVal}`;
        D20Popup.#dom.targetNumberBreakdown.textContent = `${skillVal} (Skill) + ${specialVal} (SPECIAL)`;
        D20Popup.#dom.critBreakdown.textContent = `Critical Hit: Roll ${critVal > 1 ? `≤` : `=`}${critVal}`;

        D20Popup.#dom.dice.forEach((dice, index) => {
            dice.textContent = this.#hasRolled ? this.#diceContent[index] : "?";
            dice.classList.toggle('active', this.#diceActive[index]);
            dice.classList.toggle('rerolled', this.#diceRerolled[index]);
            // '?' <= x and '?' >= x are always false.
            dice.classList.toggle('roll-crit', this.#diceContent[index] <= critVal);
            const complicationMin = this.#isObjectUnreliable ? 19 : 20;
            dice.classList.toggle('roll-complication', this.#diceContent[index] >= complicationMin);
        });

        // Don't update after rolling!
        if(!this.#hasRolled) {
            D20Popup.#dom.apCost.textContent = this.#getApCost().toString();
        }
        D20Popup.#dom.aimCheckbox.checked = this.#isAiming;
        D20Popup.#dom.aimCheckbox.disabled = this.#isObjectInaccurate || this.#hasRolled;

        D20Popup.#dom.payedLuck.textContent = this.#getPayedLuck().toString();
        D20Popup.#dom.luckCost.textContent = `(${this.#getLuckCost()})`;
        
        let successes = '?';
        if(this.#hasRolled){
            successes = 0;
            this.#diceContent.forEach(roll => {
                const rollValue = Number(roll);
                if (!isNaN(rollValue)) {
                    if (rollValue <= critVal) successes += 2;
                    else if (rollValue <= targetVal) successes++;
                }
            });
        }
        D20Popup.#dom.successesDisplay.textContent = `${translator.translate("successes")}: ${successes}`;

        if(this.#objectId){
            D20Popup.#dom.damageButton.style.display = 'block';
            D20Popup.#dom.damageButton.disabled = !this.#hasRolled;
        } else {
            D20Popup.#dom.damageButton.style.display = 'none';
        }
        if(!this.#hasRolled){
            D20Popup.#dom.rollButton.innerHTML = translator.spacedTranslate("roll", "reroll");
        } else {
            D20Popup.#dom.rollButton.innerHTML = translator.spacedTranslate("reroll", "roll");
        }
    }

    #onDiceClick(index){
        if (!this.#hasRolled) {
            const activeDice = Math.max(2, index + 1)
            this.#diceActive = [false, false, false, false, false];
            this.#diceActive.fill(true, 0, activeDice);
        } else if(this.#diceContent[index] !== '?' && !this.#diceRerolled[index]){
            this.#diceActive[index] = !this.#diceActive[index];
        }
        this.#render();
    }

    #onRoll(){

        if (this.#getActiveDiceCount() === 0) {
            return showNotification("Seleziona dei dadi da (ri)lanciare!"); // TODO Language
        }

        let luckCost = this.#getLuckCost();
        luckCost = luckCost > 0 ? luckCost : 0;
        if (this.#character.currentLuck < luckCost) {
            return showNotification("Non hai abbastanza Fortuna per farlo!"); // TODO Language
        }

        this.#character.currentLuck -= luckCost;

        this.#diceActive.forEach((isActive, index) => {
            if(isActive){
                this.#diceContent[index] = Math.floor(Math.random() * 20) + 1
                if(this.#hasRolled){
                    this.#diceRerolled[index] = true;
                }
            }
        });
        this.#diceActive = Array(5).fill(false);
        // !IMPORTANT, DON'T MOVE!
        // This is used above, keep it here
        this.#hasRolled = true;

        this.#render();
    }

    #getActiveDice(){
        return this.#diceActive.filter(Boolean);
    }

    #getActiveDiceCount(){
        return this.#getActiveDice().length;
    }

    #getRerolledDiceCount(){
        return this.#diceRerolled.filter(Boolean).length;
    }

    #getApCost(){
        switch (this.#getActiveDiceCount()) {
            case 5: return 6;
            case 4: return 3;
            case 3: return 1;
            default: return 0;
        }
    }

    #getLuckCost(){
        let luckCost;
        if(!this.#hasRolled){
            luckCost = this.#isUsingLuck-this.#isAiming;
        } else {
            const rerollingCount = this.#getActiveDiceCount();
            const rerolledCount = this.#getRerolledDiceCount();
            const alreadyPayed = this.#isUsingLuck - this.#isAiming + rerolledCount;
            luckCost = rerollingCount + (alreadyPayed < 0 ? -1 : 0); // Was aiming already used?
        }
        return luckCost;
    }

    #getPayedLuck(){
        let payedLuck = 0;
        if(this.#hasRolled){
            const rerolledCount = this.#getRerolledDiceCount();
            payedLuck = this.#isUsingLuck - this.#isAiming + rerolledCount;
        }
        return payedLuck > 0 ? payedLuck : 0;
    }
}

class D6Popup {
    static #htmlElement =document.getElementById('popup-d6');
    static #dom = {
        weaponName: document.getElementById('d6-weapon-name'),
        damageType: document.getElementById('d6-damage-type'),
        tagsContainer: document.getElementById('d6-tags'),
        damageDiceContainer: document.getElementById('d6-damage-dice-container'),
        extraHitsTitle: document.getElementById('d6-extra-hits-title'),
        extraHitsContainer: document.getElementById('d6-extra-hits-container'),
        ammoCost: document.getElementById('popup-d6-ammo-cost'),
        ammoPayed: document.getElementById('popup-d6-payed-ammo'),
        luckCost: document.getElementById('popup-d6-luck-cost'),
        luckPayed: document.getElementById('popup-d6-payed-luck'),
        totalDamage: document.getElementById('d6-total-damage'),
        totalEffects: document.getElementById('d6-total-effects'),
        rollButton: document.getElementById('d6-roll-button')
    }

    constructor(){
        D6Popup.#dom.rollButton.addEventListener('click', () => this.#onRoll());
    }

    #character;

    #object;
    #effects;
    #qualities;
    #hasRolled;

    #diceActive;
    #diceRerolled;
    #diceClasses;

    #extraDiceActive;
    #extraDiceRerolled;
    #extraDiceClasses;

    #extraHitsTitle;

    #ammoPayed;
    #ammoCost;
    #luckPayed;
    #luckCost;

    open(objectId){
        this.#initialize(objectId);
        D6Popup.#htmlElement.showModal();
    }

    #initialize(objectId){

        const weapon = dataManager.weapons[objectId];
        if (!weapon) {
            alert("Trying to attack with a non-weapon object.")
            return;
        }
        this.#object = weapon;
        this.#character = characterData;
        this.#hasRolled = false;

        this.#ammoCost = 1;
        this.#ammoPayed = 0;
        let payedAmmoDisplay = 'flex';
        if(this.#isMelee()){
            this.#ammoCost = translator.translate("na")
            payedAmmoDisplay = 'none';
        }
        D6Popup.#dom.ammoPayed.style.display = payedAmmoDisplay;

        this.#luckCost = 0;
        this.#luckPayed = 0;

        D6Popup.#dom.tagsContainer.innerHTML = '';
        this.#effects = weapon.EFFECTS;
        this.#effects.forEach(effect => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = translator.translate(effect);
            tag.dataset.tooltipId = `${effect.split(' ')[0]}Description`;
            D6Popup.#dom.tagsContainer.appendChild(tag);
        });
        this.#qualities = weapon.QUALITIES;
        this.#qualities.forEach(quality => {
            const tag = document.createElement('span');
            tag.className = 'tag tag-empty';
            tag.textContent = translator.translate(quality);
            tag.dataset.tooltipId = `${quality.split(' ')[0]}Description`;
            D6Popup.#dom.tagsContainer.appendChild(tag);
        });


        D6Popup.#dom.damageDiceContainer.innerHTML = '';
        D6Popup.#dom.extraHitsContainer.innerHTML = '';

        let damageRating = Number(weapon.DAMAGE_RATING);
        if(this.#isMelee()){
            damageRating += this.#character.meleeDamage;
        }

        for (let i = 0; i < damageRating; i++) {
            const diceDiv = this.#createD6Div(i, false);
            D6Popup.#dom.damageDiceContainer.appendChild(diceDiv);
        }
        const fireRate = weapon.FIRE_RATE;
        let extraDice = 0;
        if (this.#isMelee()) {
            extraDice = 3;
            this.#extraHitsTitle = "Colpi Extra (AP)";  // TODO language
        } else if (fireRate > 0) {
            extraDice = Number(fireRate);
            this.#extraHitsTitle = "Colpi Extra";  // TODO language
        } else {
             this.#extraHitsTitle = "No Colpi Extra"; // TODO language
        }
        for (let i = 0; i < extraDice; i++) {
            const diceDiv = this.#createD6Div(i, true);
            D6Popup.#dom.extraHitsContainer.appendChild(diceDiv);
        }

        this.#diceActive = Array(damageRating).fill(true)
        this.#diceRerolled = Array(damageRating).fill(false)
        this.#diceClasses = Array(damageRating).fill(null)
        this.#extraDiceActive = Array(extraDice).fill(false)
        this.#extraDiceRerolled = Array(extraDice).fill(false)
        this.#extraDiceClasses = Array(extraDice).fill(null)

        this.#render();
    }

    #isMelee(){
        return ["meleeWeapons", "unarmed"].includes(this.#object.SKILL);
    }

    #render(){
        const weaponName = translator.translate(this.#object.ID);
        D6Popup.#dom.weaponName.textContent = weaponName;
        D6Popup.#dom.weaponName.style.fontSize = getVariableFontSize(weaponName);
        D6Popup.#dom.damageType.textContent = this.#object.DAMAGE_TYPE; // TODO Handle language

        const dice = D6Popup.#dom.damageDiceContainer.querySelectorAll('.d6-dice');
        for(const [index, diceClass] of this.#diceClasses.entries()){
            this.#setDiceClass(dice[index], diceClass);
            dice[index].classList.toggle('active', this.#diceActive[index]);
            dice[index].classList.toggle('rerolled', this.#diceRerolled[index]);
        }

        D6Popup.#dom.extraHitsTitle.textContent = this.#extraHitsTitle;  // TODO language
        D6Popup.#dom.extraHitsContainer.style.display = this.#object.FIRE_RATE <= 0 ? 'none' : 'flex';
        const extraDice = D6Popup.#dom.extraHitsContainer.querySelectorAll('.d6-dice');
        for(const [index, diceClass] of this.#extraDiceClasses.entries()){
            this.#setDiceClass(extraDice[index], diceClass);
            extraDice[index].classList.toggle('active', this.#extraDiceActive[index]);
            extraDice[index].classList.toggle('rerolled', this.#extraDiceRerolled[index]);
        }

        if(!this.#isMelee()) {
            D6Popup.#dom.ammoPayed.textContent = this.#ammoPayed.toString();
            D6Popup.#dom.ammoCost.textContent = `(${this.#ammoCost})`;
        }
        D6Popup.#dom.luckPayed.textContent = this.#luckPayed.toString();
        D6Popup.#dom.luckCost.textContent = `(${this.#getLuckCost()})`;

        const totEffects = this.#getEffectCount();
        const totDamage = totEffects + this.#getDamage1Count() + this.#getDamage2Count() * 2
        // TODO language
        D6Popup.#dom.totalDamage.textContent = this.#hasRolled ? totDamage : '?';
        D6Popup.#dom.totalEffects.textContent = this.#hasRolled ? totEffects : '?';
        D6Popup.#dom.rollButton.innerHTML = this.#hasRolled ? translator.spacedTranslate("reroll", "roll") : translator.spacedTranslate("roll", "reroll");
    }

    #setDiceClass(dice, diceClass){
        dice.textContent = diceClass ? '' : '?';
        ["d6-face-damage1", "d6-face-damage2", "d6-face-effect", "d6-face-blank"].forEach(c => {
            dice.classList.toggle(c, diceClass === c)
        });
    }

    #getEffectCount(){
        return D6Popup.#htmlElement.querySelectorAll('.d6-dice.d6-face-effect').length;
    }

    #getDamage1Count(){
        return  D6Popup.#htmlElement.querySelectorAll('.d6-dice.d6-face-damage1').length;
    }

    #getDamage2Count() {
        return D6Popup.#htmlElement.querySelectorAll('.d6-dice.d6-face-damage2').length;
    }

    #createD6Div(index, isExtra) {
        const diceDiv = document.createElement('div');
        diceDiv.className = 'd6-dice dice';
        diceDiv.addEventListener('click', () => this.#onDiceClick(index, isExtra))
        return diceDiv
    }

    #onDiceClick(index, isExtra){
        if(!isExtra) {
            if (this.#hasRolled && !this.#diceRerolled[index]) {
                this.#diceActive[index] = !this.#diceActive[index];
            }
        } else {
            if(!this.#hasRolled){
                let ammoId = this.#object.AMMO_TYPE;
                if(ammoId === "self"){
                    ammoId = this.#object.ID;
                } else if(ammoId === "na"){
                    ammoId = null;
                }
                let isActivating = !this.#extraDiceActive[index];
                if(isActivating && ammoId && this.#character.getItemQuantity(ammoId) < this.#ammoCost+1){
                    showNotification("Non hai abbastanza munizioni per farlo!")
                } else {
                    this.#extraDiceActive[index] = !this.#extraDiceActive[index];
                    this.#ammoCost += isActivating ? 1 : -1;
                }
            } else if (this.#extraDiceClasses[index] && !this.#extraDiceRerolled[index]){
                this.#extraDiceActive[index] = !this.#extraDiceActive[index];
            }
        }
        this.#render();
    }

    #getActiveCount(){
        return this.#getActiveDiceCount() + this.#getActiveExtraDiceCount();
    }

    #getActiveDiceCount(){
        return this.#diceActive.filter(Boolean).length
    }

    #getActiveExtraDiceCount(){
        return this.#extraDiceActive.filter(Boolean).length
    }

    #getRerolledCount(){
        return this.#getRerolledDiceCount() + this.#getRerolledExtraDiceCount();
    }

    #getRerolledDiceCount(){
        return this.#diceRerolled.filter(Boolean).length
    }

    #getRerolledExtraDiceCount(){
        return this.#extraDiceRerolled.filter(Boolean).length
    }

    #getLuckCost(){
        let luckCost = 0;
        if(this.#hasRolled){
            // Rerolling damage dice costs 1 luck every 3 rerolled dice
            const rerolledCount = this.#getRerolledCount();
            const payedLeftover = rerolledCount % 3;// 1 luck x 3 rerolls. Luck for leftover was paid previous roll.
            let freeRerolls = payedLeftover > 0 ? 3 - payedLeftover : 0;
            luckCost = Math.ceil((this.#getActiveCount() - freeRerolls) / 3);
        }
        return luckCost > 0 ? luckCost : 0;
    }

    #onRoll(){
        if (this.#getActiveCount() === 0) {
            return showNotification("Seleziona dei dadi da (ri)lanciare!"); // TODO language
        }

        // TODO luck check should be done in onDiceClick
        let luckCost = this.#getLuckCost();
        luckCost = luckCost > 0 ? luckCost : 0;
        if (this.#character.currentLuck < luckCost) {
            return showNotification("Non hai abbastanza Fortuna per farlo!"); // TODO Language
        }
        this.#character.currentLuck -= luckCost;

        this.#diceActive.forEach((isActive, index) => {
            if(isActive){
                const roll = Math.floor(Math.random() * 6) + 1;

                let diceClass;
                if(roll >= 5) diceClass = "d6-face-blank";
                else if(roll >= 3) diceClass = "d6-face-effect";
                else if(roll >=2) diceClass = "d6-face-damage2";
                else diceClass = "d6-face-damage1";

                this.#diceClasses[index] = diceClass;
                if(this.#hasRolled){
                    this.#diceRerolled[index] = true;
                }
            }
        });
        this.#diceActive = Array(5).fill(false);

        this.#extraDiceActive.forEach((isActive, index) => {
            if(isActive){
                const roll = Math.floor(Math.random() * 6) + 1;

                let diceClass;
                if(roll >= 5) diceClass = "d6-face-blank";
                else if(roll >= 3) diceClass = "d6-face-effect";
                else if(roll >=2) diceClass = "d6-face-damage2";
                else diceClass = "d6-face-damage1";

                this.#extraDiceClasses[index] = diceClass;
                if(this.#hasRolled){
                    this.#extraDiceRerolled[index] = true;
                }
            }
        });
        this.#extraDiceActive = Array(5).fill(false);

        if(!this.#hasRolled) {
            this.#character.removeItem(this.#object.AMMO_TYPE, this.#ammoCost);
            this.#ammoPayed = this.#ammoCost;
            this.#ammoCost = 0;
            if(this.#effects.includes("effectBurst")){
                this.#ammoCost = `+${translator.translate("effectBurst")}`;
            }
        }
        this.#luckPayed += this.#luckCost;
        this.#luckCost = 0;

        this.#hasRolled = true;
        this.#render();
    }
}




// Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {

    /**
     * Shows a custom notification message. Replaces alert().
     * @param {string} message The message to display.
     */
    window.showNotification = (message) => {
        // TODO This is a placeholder for custom notification logic.
        console.warn("Notification:", message); // For now, we log to the console.
        // Example:
        // const notificationText = popups.notification.querySelector('.message');
        // notificationText.textContent = message;
        // popups.notification.showModal();
        alert(message); // Reverted to alert for now so you can see it working.
    }
    // TODO might have a better way, might conflict with multiple dialogs + tooltips etc
    window.closeActivePopup = () => {
        const activeDialog = document.querySelector('dialog[open]');
        if (activeDialog) {
            activeDialog.addEventListener('animationend', () => {
                activeDialog.close();
                activeDialog.classList.remove('dialog-closing');
            }, { once: true });
            activeDialog.classList.add('dialog-closing');
        }
    }

    // Close buttons for all popups
    document.querySelectorAll('.popup__button-close, dialog .button-close').forEach(btn => {
        btn.addEventListener('click', closeActivePopup);
    });

    const d20Popup = new D20Popup();
    window.openD20Popup = (skillId, objectId) => {
        d20Popup.open(skillId, objectId);
    };

    const d6Popup = new D6Popup();
    window.openD6Popup = (objectId) => {
        d6Popup.open(objectId);
    };


    const tagTooltip = new TagTooltip();
    window.openTooltip = (tagEl) => {
        tagTooltip.openTooltip(tagEl);
    };

    const statAdjustmentPopup = new StatAdjustementPopup();





    // TODO To refactor
    const popups = {
        addItem: document.getElementById('popup-addItem'),
        sellItem: document.getElementById('popup-tradeItem'),
        // It's good practice to add a dedicated notification popup instead of using alert() TODO
        notification: document.getElementById('notification-popup')
    };


    const tradeItemPopup = new TradeItemPopup();
    window.openSellItemPopup = (itemId) => {
        tradeItemPopup.openPopup(itemId);
    }

    // Elements specific to the Add Item Popup
    const addItemPopupElements = {
        select: popups.addItem.querySelector('#popup-addItem__selector'),
        quantity: popups.addItem.querySelector('#popup-addItem__quantity'),
        confirmButton: popups.addItem.querySelector('.confirm-button')
    };

    window.openAddItemModal = (itemType) => {
        // This mapping makes the function much cleaner and easier to extend.
        const itemConfig = {
            // TODO use langData
            smallGuns: { data: dataManager.weapons, isWeapon: true },
            energyWeapons: { data: dataManager.weapons, isWeapon: true },
            bigGuns: { data: dataManager.weapons, isWeapon: true },
            meleeWeapons: { data: dataManager.weapons, isWeapon: true },
            explosives: { data: dataManager.weapons, isWeapon: true },
            throwing: { data: dataManager.weapons, isWeapon: true },
            food: { data: dataManager.food },
            drinks: { data: dataManager.drinks },
            meds: { data: dataManager.meds },
            ammo: { data: dataManager.ammo }
        };

        const config = itemConfig[itemType];
        if (!config) return;

        // Filter items
        const availableItems = Object.values(config.data).filter(item =>
            !config.isWeapon || item.SKILL === itemType
        );

        // Populate select element
        addItemPopupElements.select.innerHTML = "";
        const formattedItemType = translator.translate(config.isWeapon ? "weapons" : itemType)
        const defaultOptionText = translator.translate("default_add_item_option").replace("%s", formattedItemType)
        const defaultOption = new Option(defaultOptionText, '', true, true);
        defaultOption.disabled = true;
        addItemPopupElements.select.appendChild(defaultOption);
        addItemPopupElements.select.dataItemType = itemType;

        availableItems.forEach(item => {
            const optionText = translator.translate(item.ID); // Fallback to ID
            addItemPopupElements.select.appendChild(new Option(optionText, item.ID));
        });

        popups.addItem.showModal();
    };

    // Add item popup listener
    addItemPopupElements.confirmButton.addEventListener('click', () => {
        const selectedId = addItemPopupElements.select.value;
        const itemType = addItemPopupElements.select.dataItemType;
        const quantity = Number(addItemPopupElements.quantity.value);
        if (selectedId) {
            characterData.addItem(selectedId, itemType, quantity);
            addItemPopupElements.quantity.value = 1;
            console.log(`Adding item: ${selectedId} x${quantity}`);
            closeActivePopup();
        }
    });
});