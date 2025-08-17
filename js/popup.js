class Popup {
    _rootElement = null;

    constructor(rootElementId, triggers = []) {
        if (this.constructor === Popup) {
            throw new TypeError('Abstract class "Popup" cannot be instantiated directly.');
        }

        this._rootElement = document.getElementById(rootElementId);
        if (!this._rootElement) {
            throw new Error(`Popup element with ID "${rootElementId}" not found.`);
        }

        for(const trigger of triggers){
            trigger.addEventListener('click', () => this.open())
        }

        this._rootElement.addEventListener('click', (e) => {
            if(e.target.closest('.popup__button-confirm')){
                this._handleConfirm();
                // No closing here, the _handleConfirm() method can
                // prevent closing on specific conditions
            }
        });
        this._rootElement.addEventListener('click', (e) => {
            if (e.target.closest('.popup__button-x, .popup__button-close')) {
                this._close();
            }
        });
    }

    /**
     * Opens the popup dialog.
     * Calls the subclass's specific initialize method.
     * @param {...any} args - Arguments to pass to the initialize method.
     */
    open(...args) {
        this._initialize(...args);
        this._render();
        this._open();
    }

    /**
     * By default, calls _rootElement.showModal().
     * If custom logic is needed (like TooltipPopup), this can be overridden.
     */
    _open(){
        this._rootElement.showModal();
    }

    /**
     * Placeholder for subclass-specific setup logic.
     * This method is intended to be overridden by subclasses.
     * @protected
     */
    _initialize() {
        // Subclasses will override this to set up their specific state.
    }

    /**
     * Placeholder for subclass-specific confirm button logic.
     * This method is intended to be overridden by subclasses.
     * @protected
     */
    _handleConfirm() {
        // Subclasses will override this to set up their specific state.
    }

    /**
     * Placeholder for subclass-specific rendering logic.
     * @protected
     */
    _render() {
        // Subclasses will override this to update the DOM.
    }

    /** Closes the popup dialog using the global helper. */
    _close() {
        closeActivePopup();
    }
}

class StatAdjustmentPopup extends Popup {
    #dom;

    #currentHp;
    #caps;
    #currentLuck;

    constructor() {
        super('popup-editHeaderStats',
            [document.getElementById('c-headerStats')]);
        this.#dom = {
            hpOld: document.getElementById("adjustHpOld"),
            hpNew: document.getElementById("adjustHpNew"),

            capsOld: document.getElementById("adjustCapsOld"),
            capsNew: document.getElementById("adjustCapsNew"),

            luckOld: document.getElementById("adjustLuckOld"),
            luckNew: document.getElementById("adjustLuckNew"),
        }
        
        this.#dom.hpNew.addEventListener('change', (e) => this.#currentHp = e.target.value);
        this.#dom.capsNew.addEventListener('change', (e) => this.#caps = e.target.value);
        this.#dom.luckNew.addEventListener('change', (e) => this.#currentLuck = e.target.value);

    }
    _initialize() {
        this.#currentHp = characterData.currentHp;
        this.#caps = characterData.caps;
        this.#currentLuck = characterData.currentLuck;

        this.#dom.hpOld.textContent = `${this.#currentHp}/${characterData.maxHp}`;
        this.#dom.capsOld.textContent = this.#caps;
        this.#dom.luckOld.textContent = `${this.#currentLuck}/${characterData.getSpecial(SPECIAL.LUCK)}`;

        this._render();
    }

    _render() {
        this.#dom.hpNew.value = this.#currentHp;
        this.#dom.capsNew.value = this.#caps;
        this.#dom.luckNew.value = this.#currentLuck;
    }

    _handleConfirm() {
        if(this.#currentHp < 0 || this.#currentHp > characterData.maxHp)
            alertPopup("invalidHpAlert");
        else if(this.#caps < 0)
            alertPopup("invalidCapsAlert");
        else if(this.#currentLuck < 0 || this.#currentLuck > characterData.getSpecial(SPECIAL.LUCK))
            alertPopup("invalidLuckAlert");
        else {
            characterData.currentHp = this.#currentHp;
            characterData.caps = this.#caps;
            characterData.currentLuck = this.#currentLuck;
            this._close();
        }
    }
}

class TradeItemPopup extends Popup {
    #dom;
    
    constructor(){
        super('popup-tradeItem');
        this.#dom = {
            type: document.getElementById('tradeType'),
            quantity: document.getElementById('tradeQuantity'),
            price: document.getElementById('tradePrice'),
            total: document.getElementById('tradeTotal'),
            confirm: this._rootElement.querySelector(".popup__button-confirm")
        }
        this.#dom.quantity.addEventListener('change', (e) => {
            this.#tradeQuantity = e.target.value;
            this._render();
        });
        this.#dom.price.addEventListener('change', (e) => {
            this.#tradePrice = e.target.value;
            this._render();
        });
    }

    #isBuy;
    #itemId;
    #tradeQuantity;
    #tradePrice;
    get #tradeValueRate () { return this.#isBuy ? 6/5 : 4/5 }


    _initialize(itemId, isBuy){
        this.#isBuy = !!isBuy;
        this.#itemId = itemId;
        if(this.#isBuy){
            this.#tradeQuantity = 1;
        } else {
            this.#tradeQuantity = characterData.getItemQuantity(this.#itemId);
            this.#dom.quantity.max = this.#tradeQuantity;
        }
        let price = dataManager.getItem(this.#itemId).COST || 1; // Get normal item price
        price = price * this.#tradeValueRate; // Apply trade rate
        price  = Math.round(price*100)/100; // Round decimals
        this.#tradePrice = price;
    }
    
    _render(){
        this.#dom.type.textContent = translator.translate(this.#isBuy ? "buying" : "selling");
        this.#dom.quantity.value = this.#tradeQuantity;
        this.#dom.price.value = this.#tradePrice;
        const sign = this.#isBuy ? "-" : "+";
        const total = Math.floor(this.#tradeQuantity * this.#tradePrice);
        this.#dom.total.textContent = `${sign}${total}`
    }

    _handleConfirm(){
        if(characterData.getItemQuantity(this.#itemId))
            characterData.caps += Number(this.#dom.total.textContent);
        characterData.removeItem(this.#itemId, this.#dom.quantity.value);
        this._close();
    }
    
}

class TagTooltip extends Popup {

    #arrow = document.getElementById("arrow");
    #activeTag;

    constructor(){
        super('tooltip-container')
        document.body.addEventListener('mouseover', (event) => {
            if(event.target.matches('.tag')){
                this.open(event.target);
            }
        });
        document.body.addEventListener('mouseout', (event) => {
            if(event.target.matches('.tag')){
                this.hideTooltip();
            }
        });

        // Touch events for mobile (toggle behavior)
        document.addEventListener('touchstart', (e) => {
            this.#handleTouchEvent(e);
        }, { passive: false });

        // Hide tooltip if clicking outside an active tag
        document.addEventListener('click', (e) => {
            this.#handleTouchEvent(e);
        });
    }

    _open() {
        this._rootElement.classList.add('visible');
    }

    #handleTouchEvent(event){
        const touchedTag = event.target.closest('.tag');
        if (touchedTag) {
            event.preventDefault();
            // If tapping the same tag that's already active, hide it.
            if (this.#activeTag === touchedTag) {
                this.hideTooltip();
            } else { // If another tooltip is open, hide it first.
                if (this.#activeTag) {
                   this.hideTooltip();
                }
                this.open(touchedTag);
            }
        } else if (this.#activeTag && !this._rootElement.contains(event.target)) {
            // If tapping outside an active tag and the tooltip, hide it.
            this.hideTooltip();
        }
    }

    _initialize(tagTarget){
        this.#activeTag = tagTarget;

        this._rootElement.textContent = translator.translate(this.#activeTag.dataset.tooltipId);

        this.#arrow = document.createElement('div');
        this.#arrow.className = 'tooltip-arrow';
        this._rootElement.appendChild(this.#arrow); // Re-add arrow

        const parentDialog = tagTarget.closest('dialog[open]');
        if (parentDialog) {
            parentDialog.appendChild(this._rootElement);
        }
    }

    _render(){
        const tagRect = this.#activeTag.getBoundingClientRect();
        const tooltipRect = this._rootElement.getBoundingClientRect();

        const spacing = 12; // Space between the tag and the tooltip

        this._rootElement.className = 'tooltip-panel visible pos-top';

        const dialogRect = this.#activeTag.closest('dialog[open]')?.getBoundingClientRect();
        const dialogTop = dialogRect?.top || 0;
        const dialogLeft = dialogRect?.left || 0;
        let top = tagRect.top - tooltipRect.height - spacing;
        let left = tagRect.left + (tagRect.width / 2) - (tooltipRect.width / 2);

        // If it goes off the top of the screen, place it below instead
        if (top < 0) {
            this._rootElement.className = 'tooltip-panel visible pos-bottom';
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

        this._rootElement.style.top = `${top - dialogTop}px`;
        this._rootElement.style.left = `${left - dialogLeft}px`;
    }

    hideTooltip() {
        this.#activeTag = null;
        // KEY CHANGE: Move tooltip back to the body to reset it for non-dialog tags.
        if (this._rootElement.parentElement !== document.body) {
            document.body.appendChild(this._rootElement);
        }

        this._rootElement.classList.remove('visible');
    };
}

class D20Popup extends Popup {

    #dom;

    constructor() {
        super('popup-d20');

        this.#dom = {
            skillTitle: document.getElementById('popup-d20__skillTitle'),

            specialSelector: document.getElementById('popup-d20__selector-special'),
            luckCheckbox: document.getElementById('popup-d20__checkbox-luck'),

            targetNumber: document.getElementById('popup-d20-target'),
            targetNumberBreakdown: document.getElementById('popup-d20-target-breakdown'),
            critBreakdown: document.getElementById('popup-d20-crit-breakdown'),

            dice: this._rootElement.querySelectorAll('.d20-dice'),

            apCost: document.getElementById('popup-d20-ap-cost'),
            aimCheckbox: document.getElementById('popup-d20-aim-checkbox'),
            payedLuck: document.getElementById('popup-d20-payed-luck'),
            luckCost: document.getElementById('popup-d20-luck-cost'),

            successesDisplay: document.getElementById('popup-d20-successes-display'),

            rollButton: document.getElementById('popup-d20-roll-button'),
            damageButton: document.getElementById('popup-d20-damage-button'),
        };

        this.#dom.specialSelector.addEventListener('change', (event) => {
            this.#specialId = event.target.value;
            this._render();
        });
        this.#dom.luckCheckbox.addEventListener('change', (event) => {
            this.#isUsingLuck = event.target.checked;
            this._render();
        });
        this.#dom.dice.forEach((dice, index) => {
            dice.addEventListener('click', () => {
                this.#onDiceClick(index);
            });
        });
        this.#dom.aimCheckbox.addEventListener('change', (event) => {
            this.#isAiming = event.target.checked;
            this._render();
        });
        this.#dom.damageButton.addEventListener('click', () => {
            this._close();
            openD6Popup(this.#objectId);
        });
        this.#dom.rollButton.addEventListener('click', () => this.#onRoll());
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

    _initialize(skillId, objectId){
        this.#character = characterData;

        this.#objectId = objectId;

        const object = dataManager.getItem(objectId);
        this.#isObjectInaccurate = (object?.QUALITIES || []).includes("qualityInaccurate");
        this.#isObjectUnreliable = (object?.QUALITIES || []).includes("qualityUnreliable");

        // If inaccurate strikethrough "Aim?"
        const aimText = this._rootElement.querySelector('[data-lang-id="aim"]');
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
    }

    _render() {
        const skillName = translator.translate(this.#skillId);
        this.#dom.skillTitle.textContent = skillName;
        this.#dom.skillTitle.style.fontSize = getVariableFontSize(skillName);

        const activeSpecialId = this.#isUsingLuck ? SPECIAL.LUCK : this.#specialId;
        this.#dom.specialSelector.value = activeSpecialId;
        this.#dom.specialSelector.disabled = this.#hasRolled || this.#isUsingLuck;

        this.#dom.luckCheckbox.checked = this.#isUsingLuck;
        this.#dom.luckCheckbox.disabled = this.#hasRolled;

        const skillVal = this.#character.getSkill(this.#skillId);
        const specialVal = this.#character.getSpecial(activeSpecialId);
        const targetVal = skillVal + specialVal;
        const isSpecialty = this.#character.hasSpecialty(this.#skillId);
        const critVal = isSpecialty ? skillVal : 1;
        // TODO language (Target, Skill, Critical Hit, etc...)
        this.#dom.targetNumber.textContent = `Target: ${targetVal}`;
        this.#dom.targetNumberBreakdown.textContent = `${skillVal} (Skill) + ${specialVal} (SPECIAL)`;
        this.#dom.critBreakdown.textContent = `Critical Hit: Roll ${critVal > 1 ? `≤` : `=`}${critVal}`;

        this.#dom.dice.forEach((dice, index) => {
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
            this.#dom.apCost.textContent = this.#getApCost().toString();
        }
        this.#dom.aimCheckbox.checked = this.#isAiming;
        this.#dom.aimCheckbox.disabled = this.#isObjectInaccurate || this.#hasRolled;

        this.#dom.payedLuck.textContent = this.#getPayedLuck().toString();
        this.#dom.luckCost.textContent = `(${this.#getLuckCost()})`;
        
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
        this.#dom.successesDisplay.textContent = `${translator.translate("successes")}: ${successes}`;

        if(this.#objectId){
            this.#dom.damageButton.style.display = 'block';
            this.#dom.damageButton.disabled = !this.#hasRolled;
        } else {
            this.#dom.damageButton.style.display = 'none';
        }
        if(!this.#hasRolled){
            this.#dom.rollButton.innerHTML = translator.spacedTranslate("roll", "reroll");
        } else {
            this.#dom.rollButton.innerHTML = translator.spacedTranslate("reroll", "roll");
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
        this._render();
    }

    #onRoll(){

        if (this.#getActiveDiceCount() === 0) {
            return alertPopup("selectDiceAlert");
        }

        let luckCost = this.#getLuckCost();
        if (this.#character.currentLuck < luckCost) {
            return alertPopup("notEnoughLuckAlert");
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

        this._render();
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
            luckCost = this.#isUsingLuck ? 1 : 0;
        } else {
            const rerollingCount = this.#getActiveDiceCount();
            const rerolledCount = this.#getRerolledDiceCount();
            const alreadyPayed = this.#isUsingLuck - this.#isAiming + rerolledCount;
            luckCost = rerollingCount + (alreadyPayed < 0 ? -1 : 0); // Was aiming already used?
        }
        return luckCost > 0 ? luckCost : 0;
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

class D6Popup extends Popup {
    #dom;

    constructor(){
        super('popup-d6');
        this.#dom = {
            weaponName: document.getElementById('d6-weapon-name'),
            damageType: document.getElementById('d6-damage-type'),
            tagsContainer: document.getElementById('d6-tags'),
            damageDiceContainer: document.getElementById('d6-damage-dice-container'),
            extraHitsTitle: document.getElementById('d6-extra-hits-title'),
            extraHitsType: document.getElementById('d6-extra-hits-type'),
            extraHitsContainer: document.getElementById('d6-extra-hits-container'),
            ammoCost: document.getElementById('popup-d6-ammo-cost'),
            ammoPayed: document.getElementById('popup-d6-payed-ammo'),
            luckCost: document.getElementById('popup-d6-luck-cost'),
            luckPayed: document.getElementById('popup-d6-payed-luck'),
            totalDamage: document.getElementById('d6-total-damage'),
            totalEffects: document.getElementById('d6-total-effects'),
            rollButton: document.getElementById('d6-roll-button')
        }
        this.#dom.rollButton.addEventListener('click', () => this.#onRoll());
    }

    #character;

    #object;
    #hasAimed;
    #hasAccurate;
    #isUsingAccurate;
    #isGatling;
    #ammoStep;

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
    #extraHitsType;


    #ammoPayed;
    #ammoCost;
    #luckPayed;
    #luckCost;

    _initialize(objectId, hasAimed = false){

        const weapon = dataManager.weapons[objectId];

        this.#object = weapon;
        this.#hasAimed = hasAimed;
        this.#hasAccurate = (weapon.QUALITIES || []).includes("qualityAccurate");
        this.#isUsingAccurate = false;
        this.#isGatling = (weapon.QUALITIES || []).includes("qualityGatling");
        this.#ammoStep = this.#isGatling ? 10 : 1;

        this.#character = characterData;
        this.#hasRolled = false;

        this.#ammoCost = this.#ammoStep;
        this.#ammoPayed = 0;
        let payedAmmoDisplay = 'flex';
        if(isMelee(this.#object.SKILL)){
            this.#ammoCost = translator.translate("na")
            payedAmmoDisplay = 'none';
        }
        this.#dom.ammoPayed.style.display = payedAmmoDisplay;

        this.#luckCost = 0;
        this.#luckPayed = 0;

        this.#dom.tagsContainer.innerHTML = '';
        this.#effects = weapon.EFFECTS;
        this.#effects.forEach(effect => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = translator.translate(effect);
            tag.dataset.tooltipId = `${effect.split(' ')[0]}Description`;
            this.#dom.tagsContainer.appendChild(tag);
        });
        this.#qualities = weapon.QUALITIES;
        this.#qualities.forEach(quality => {
            const tag = document.createElement('span');
            tag.className = 'tag tag-empty';
            tag.textContent = translator.translate(quality);
            tag.dataset.tooltipId = `${quality.split(' ')[0]}Description`;
            this.#dom.tagsContainer.appendChild(tag);
        });


        this.#dom.damageDiceContainer.innerHTML = '';

        let damageRating = Number(weapon.DAMAGE_RATING);
        if(isMelee(this.#object.SKILL)){
            damageRating += this.#character.meleeDamage;
        }

        for (let i = 0; i < damageRating; i++) {
            const diceDiv = this.#createD6Div(i, false);
            this.#dom.damageDiceContainer.appendChild(diceDiv);
        }
        this.#diceActive = Array(damageRating).fill(true)
        this.#diceRerolled = Array(damageRating).fill(false)
        this.#diceClasses = Array(damageRating).fill(null)

        this.#dom.extraHitsType.style.border = undefined;
        const fireRate = weapon.FIRE_RATE;
        let extraDice = 0;
        this.#extraHitsTitle = translator.translate("extraHits");
        if (isMelee(this.#object.SKILL)) {
            extraDice = 3;
            this.#extraHitsType = "ap";
        } else if (fireRate > 0) {
            extraDice = Number(fireRate * (this.#isGatling ? 2 : 1));
            this.#extraHitsType = "ammo";
        } else {
            this.#extraHitsType = null;
        }
        if(this.#hasAimed && this.#hasAccurate){
            if(this.#extraHitsType === "ammo"){
                // TODO when implementing weapon mods check this out
                //  (and finish implementing, for example add click listener to extraHitsType to change AP/Ammo)
                this.#dom.extraHitsType.style.border = "var(--border-primary-thin)";
            }
            if(this.#extraHitsType == null)
                this.#extraHitsType = "ap";
        }
        this.#initExtraDice(extraDice);
    }

    #initExtraDice(diceNumber){
        this.#extraDiceActive = Array(diceNumber).fill(false)
        this.#extraDiceRerolled = Array(diceNumber).fill(false)
        this.#extraDiceClasses = Array(diceNumber).fill(null)
        this.#dom.extraHitsContainer.innerHTML = '';
        for (let i = 0; i < diceNumber; i++) {
            const diceDiv = this.#createD6Div(i, true);
            this.#dom.extraHitsContainer.appendChild(diceDiv);
        }
    }

    _render(){
        const weaponName = translator.translate(this.#object.ID);
        this.#dom.weaponName.textContent = weaponName;
        this.#dom.weaponName.style.fontSize = getVariableFontSize(weaponName);
        this.#dom.damageType.textContent = this.#object.DAMAGE_TYPE; // TODO Handle language

        const dice = this.#dom.damageDiceContainer.querySelectorAll('.d6-dice');
        for(const [index, diceClass] of this.#diceClasses.entries()){
            this.#setDiceClass(dice[index], diceClass);
            dice[index].classList.toggle('active', this.#diceActive[index]);
            dice[index].classList.toggle('rerolled', this.#diceRerolled[index]);
        }

        this.#dom.extraHitsTitle.textContent = this.#extraHitsTitle;
        this.#dom.extraHitsType.textContent = `[${translator.translate(this.#extraHitsType)}]`;
        this.#dom.extraHitsContainer.style.display = this.#object.FIRE_RATE <= 0 ? 'none' : 'flex';
        const extraDice = this.#dom.extraHitsContainer.querySelectorAll('.d6-dice');
        for(const [index, diceClass] of this.#extraDiceClasses.entries()){
            this.#setDiceClass(extraDice[index], diceClass);
            extraDice[index].classList.toggle('active', this.#extraDiceActive[index]);
            extraDice[index].classList.toggle('rerolled', this.#extraDiceRerolled[index]);
        }

        if(!isMelee(this.#object.SKILL)) {
            this.#dom.ammoPayed.textContent = this.#ammoPayed.toString();
        }
        this.#dom.ammoCost.textContent = `(${this.#ammoCost})`;
        this.#dom.luckPayed.textContent = this.#luckPayed.toString();
        this.#dom.luckCost.textContent = `(${this.#getLuckCost()})`;

        const totEffects = this.#getEffectCount();
        const totDamage = totEffects + this.#getDamage1Count() + this.#getDamage2Count() * 2
        // TODO language
        this.#dom.totalDamage.textContent = this.#hasRolled ? totDamage : '?';
        this.#dom.totalEffects.textContent = this.#hasRolled ? totEffects : '?';
        this.#dom.rollButton.innerHTML = this.#hasRolled ? translator.spacedTranslate("reroll", "roll") : translator.spacedTranslate("roll", "reroll");
    }

    #setDiceClass(dice, diceClass){
        dice.textContent = diceClass ? '' : '?';
        ["d6-face-damage1", "d6-face-damage2", "d6-face-effect", "d6-face-blank"].forEach(c => {
            dice.classList.toggle(c, diceClass === c)
        });
    }

    #getEffectCount(){
        return this._rootElement.querySelectorAll('.d6-dice.d6-face-effect').length;
    }

    #getDamage1Count(){
        return this._rootElement.querySelectorAll('.d6-dice.d6-face-damage1').length;
    }

    #getDamage2Count() {
        return this._rootElement.querySelectorAll('.d6-dice.d6-face-damage2').length;
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
                if(isActivating && ammoId && this.#character.getItemQuantity(ammoId) < this.#ammoCost+this.#ammoStep){
                    alertPopup("notEnoughAmmoAlert");
                } else {
                    this.#extraDiceActive[index] = !this.#extraDiceActive[index];
                    if(this.#isGatling) {
                        const indexOffset = index % 2 === 0 ? +1 : -1;
                        this.#extraDiceActive[index + indexOffset] = !this.#extraDiceActive[index + indexOffset];
                    }
                    if(ammoId)
                        this.#ammoCost += (isActivating ? 1 : -1) * this.#ammoStep;
                }
            } else if (this.#extraDiceClasses[index] && !this.#extraDiceRerolled[index]){
                this.#extraDiceActive[index] = !this.#extraDiceActive[index];
            }
        }
        this._render();
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
        return luckCost;
    }

    #onRoll(){
        if (this.#getActiveCount() === 0) {
            return alertPopup("selectDiceAlert");
        }

        let luckCost = this.#getLuckCost();
        luckCost = luckCost > 0 ? luckCost : 0;
        if (this.#character.currentLuck < luckCost) {
            return alertPopup("notEnoughLuckAlert");
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
        this.#diceActive = Array(this.#diceActive.length).fill(false);

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
        this.#extraDiceActive = Array(this.#extraDiceActive.length).fill(false);

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
        this._render();
    }
}

class AddItemPopup extends Popup {

    #dom;

    constructor(){
        super('popup-addItem');
        this.#dom = {
            select: document.getElementById('popup-addItem__selector'),
            quantity: document.getElementById('popup-addItem__quantity'),
        }
    }

    _initialize(itemType) {
        const isWeapon = Object.values(SKILLS).includes(itemType)
        let data ;
        let availableItems;
        if(isWeapon) {
            data = dataManager.weapons;
            availableItems = Object.values(data).filter(item =>
                item.SKILL === itemType && !dataManager.isUnacquirable(item.ID)
            );
        } else if(["clothing", "outfit", "headgear"].includes(itemType)){
            data = dataManager.clothing;
            availableItems = Object.values(data).filter(item =>
                item.TYPE === itemType
            );
        } else if(itemType.endsWith("Armor")){
            const subtype = itemType.replace("Armor", "");
            data = dataManager.armor;
            availableItems = Object.values(data).filter(item =>
                item.SUBTYPE === subtype
            );
        } else {
            data = dataManager[itemType];
            availableItems = Object.values(data);
        }

        // Populate select element
        this.#dom.select.innerHTML = "";
        const formattedItemType = translator.translate(isWeapon ? "weapons" : itemType)
        const defaultOptionText = translator.translate("default_add_item_option").replace("%s", formattedItemType)
        const defaultOption = new Option(defaultOptionText, '', true, true);
        defaultOption.disabled = true;
        this.#dom.select.appendChild(defaultOption);
        this.#dom.select.dataItemType = itemType;

        availableItems.forEach(item => {
            let suffixes = [''];
            if(item.ID.endsWith("Arm") || item.ID.endsWith("Leg")){
                suffixes = ["left", "right"];
            }
            for(let suffix of suffixes) {
                let textSuffix = '';
                if(suffix) {
                    textSuffix = ` (${translator.translate(suffix)})`;
                    suffix = `_${suffix}`;
                }
                const optionText = `${translator.translate(item.ID)}${textSuffix}`;
                this.#dom.select.appendChild(new Option(optionText, `${item.ID}${suffix}`));
            }
        });
        this.#dom.quantity.value = 1;
    }

    _handleConfirm() {
        const selectedId = this.#dom.select.value;
        const itemType = this.#dom.select.dataItemType;
        const quantity = Number(this.#dom.quantity.value);
        if (selectedId) {
            characterData.addItem(selectedId, itemType, quantity);
            console.log(`Adding item: ${selectedId} x${quantity}`);
            closeActivePopup();
        }
    }
}

class AlertPopup extends Popup {
    #dom;

    constructor() {
        super("popup-alert");
        this.#dom = {
            title: document.getElementById("popup-alert__title"),
            content: document.getElementById("popup-alert__content"),
            buttonConfirm: this._rootElement.querySelector(".popup__button-confirm")
        }
    }

    #title;
    #content;
    #confirmCallback;

    _initialize(content, confirmCallback = null) {
        this.#title = translator.translate(confirmCallback ? "confirm" : "warning");
        this.#content = content.indexOf(' ') > -1 ? content : translator.translate(content); // TODO language
        this.#confirmCallback = confirmCallback;
        this.#dom.buttonConfirm.style.display = confirmCallback ? "block" : "none";
    }

    _render(){
        this.#dom.title.textContent = this.#title;
        this.#dom.content.textContent = this.#content;
    }

    _handleConfirm() {
        this._rootElement.close();
        this.#confirmCallback();
    }

    _close() {
        this._rootElement.close();
    }

}



// TODO might have a better way, might conflict with multiple dialogs + tooltips etc
function closeActivePopup() {
    closePopup(document.querySelector('dialog[open]'));
}

function closePopup(popupToClose) {
    if (popupToClose) {
        popupToClose.addEventListener('animationend', () => {
            popupToClose.close();
            popupToClose.classList.remove('dialog-closing');
        }, { once: true });
        popupToClose.classList.add('dialog-closing');
    }
}

// Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {

    const d20Popup = new D20Popup();
    window.openD20Popup = (skillId, objectId) => {
        d20Popup.open(skillId, objectId);
    };

    const d6Popup = new D6Popup();
    window.openD6Popup = (objectId) => {
        d6Popup.open(objectId);
    };



    const tradeItemPopup = new TradeItemPopup();
    window.openSellItemPopup = (itemId) => {
        tradeItemPopup.open(itemId);
    }

    // They are unused because they auto-handle opening logic
    const statAdjustmentPopup = new StatAdjustmentPopup();
    const tagTooltip = new TagTooltip();

    const alertPopup = new AlertPopup();
    window.alertPopup = (message) => {
        alertPopup.open(message);
    }
    window.confirmPopup = (message, confirmCallback) => {
        alertPopup.open(message, confirmCallback);
    }

    const addItemPopup = new AddItemPopup();
    window.openAddItemModal = (itemType) => {
        addItemPopup.open(itemType);
    }


    // TODO To refactor
    const popups = {
        notification: document.getElementById('notification-popup')
    };
});