import { useState, useRef, useEffect } from 'react';
import { useCharacter } from '@/contexts/CharacterContext'
import { useTranslation } from 'react-i18next'
import { useTooltip } from '@/contexts/TooltipContext'
import { useDialog } from '@/hooks/useDialog'
import { createInitialDiceState, rollD20, getHitLocationFromRoll, CreatureType } from '@/components/popup/utils/diceUtils.ts'
import { CharacterItem, GenericPopupProps, ItemCategory, WeaponItem } from '@/types';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import Tag from '@/components/Tag.tsx';
import PopupHeader from '@/components/popup/common/PopupHeader.tsx';
import DialogPortal from '@/components/popup/common/DialogPortal.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';

interface D6PopupProps extends GenericPopupProps {
    usingItem: CharacterItem;
    hasAimed: boolean;
    isMysteriousStranger: boolean;
}

function D6Popup({ onClose, usingItem, hasAimed = false, isMysteriousStranger = false }: Readonly<D6PopupProps>) {
    const { t } = useTranslation();
    const dataManager = getGameDatabase();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const meltdownDialogRef = useRef<HTMLDialogElement>(null);
    const { character, updateCharacter } = useCharacter();
    useTooltip();
    const { showConfirm } = usePopup();

    const weaponData = getModifiedItemData(usingItem) as WeaponItem;

    const isMelee = (itemCategory: ItemCategory) => itemCategory === 'meleeWeapons' || itemCategory === 'unarmed';

    const getDamageRating = () => {
        if (!weaponData) { return 2; }
        let rating = weaponData.DAMAGE_RATING;
        if (isMelee(weaponData.CATEGORY)) { rating += character.meleeDamage; }
        if(weaponData.CATEGORY === "energyWeapons"){ rating += character.perks.filter(p => p === 'perkLaserCommander').length }
        return rating;
    };

    const isGatling = (weaponData?.QUALITIES || []).includes('qualityGatling');
    const isAccurate = (weaponData?.QUALITIES || []).includes('qualityAccurate');
    const fireRateNum = Number(weaponData?.FIRE_RATE) || 0;
    const isAmmoHungry = (weaponData?.QUALITIES || []).some(q => q.startsWith('qualityAmmoHungry'));

    const canChooseExtraHitsType = !!(weaponData && !isMelee(weaponData.CATEGORY) && hasAimed && isAccurate && fireRateNum > 0);
    const getDefaultExtraHitsType = () => {
        if (!weaponData) return null as 'ap' | 'ammo' | null;
        if (isMelee(weaponData.CATEGORY)) return 'ap';
        if (Number(weaponData.FIRE_RATE) > 0) return 'ammo';
        if (hasAimed && isAccurate) return 'ap';
        return null;
    };
    const [chosenExtraHitsType, setChosenExtraHitsType] = useState<'ap' | 'ammo' | null>(
        canChooseExtraHitsType ? 'ap' : getDefaultExtraHitsType()
    );

    const getEffectiveExtraHitsType = () => (
        canChooseExtraHitsType ? (chosenExtraHitsType ?? getDefaultExtraHitsType()) : getDefaultExtraHitsType()
    );

    const getExtraDiceCount = () => {
        if (isMysteriousStranger || !weaponData) { return 0; }
        if (isMelee(weaponData.CATEGORY)) { return 3; }
        const t = getEffectiveExtraHitsType();
        if (t === 'ammo') { return Math.max(0, Number(weaponData.FIRE_RATE) || 0) * (isGatling ? 2 : 1); }
        if (t === 'ap') { return 3; }
        return 0;
    };

    const damageRating = getDamageRating();
    const extraDiceCount = getExtraDiceCount();

    const [hasRolled, setHasRolled] = useState(false);
    const initialDiceState = createInitialDiceState(damageRating);
    const [diceClasses, setDiceClasses] = useState(initialDiceState.classes);
    const [diceActive, setDiceActive] = useState(initialDiceState.active);
    const [diceRerolled, setDiceRerolled] = useState(isMysteriousStranger ? initialDiceState.active : initialDiceState.rerolled);

    const initialExtraDiceState = createInitialDiceState(extraDiceCount, false);
    const [extraDiceClasses, setExtraDiceClasses] = useState(initialExtraDiceState.classes);
    const [extraDiceActive, setExtraDiceActive] = useState(initialExtraDiceState.active);
    const [extraDiceRerolled, setExtraDiceRerolled] = useState(initialExtraDiceState.rerolled);

    useEffect(() => {
        const s = createInitialDiceState(extraDiceCount, false);
        setExtraDiceClasses(s.classes);
        setExtraDiceActive(s.active);
        setExtraDiceRerolled(s.rerolled);
        if (!hasRolled && !isMelee(weaponData.CATEGORY)) {
            const hitsType = getEffectiveExtraHitsType();
            if (hitsType === 'ap') {
                setAmmoCost(ammoStep);
            } else if (hitsType === 'ammo') {
                const activeExtra = s.active.filter(Boolean).length;
                setAmmoCost(ammoStep + activeExtra * ammoStep);
            }
        }
    }, [extraDiceCount]);

    let ammoStep = 0;
    if(!isMysteriousStranger && !["na", undefined, "-"].includes(weaponData.AMMO_TYPE)){
        if(isGatling){ ammoStep = 10; }
        else if(isAmmoHungry) {
            const quality = weaponData.QUALITIES?.find(q => q.startsWith("qualityAmmoHungry"))
            const [_, qualityOpt] = quality?.split(':') ?? [];
            ammoStep = Number(qualityOpt) || 1;
        } else { ammoStep = 1 }
    }
    const [ammoCost, setAmmoCost] = useState(ammoStep);
    const [ammoPayed, setAmmoPayed] = useState(0);
    const [luckPayed, setLuckPayed] = useState(0);
    const [burstEffectsUsed, setBurstEffectsUsed] = useState(0);
    const [creatureType, setCreatureType] = useState<CreatureType>('humanoid');
    const [hitLocationRoll, setHitLocationRoll] = useState(rollD20());
    const [gunFuUsed, setGunFuUsed] = useState(false);
    const [slayerUsed, setSlayerUsed] = useState(false);
    const [meltdownUsed, setMeltdownUsed] = useState(false);
    const [meltdownPopupOpen, setMeltdownPopupOpen] = useState(false);
    const [meltdownDiceValues, setMeltdownDiceValues] = useState<number[]>([]);

    const hitLocation = getHitLocationFromRoll(hitLocationRoll, creatureType);

    useEffect(() => {
        if (meltdownPopupOpen && meltdownDialogRef.current) { meltdownDialogRef.current.showModal(); }
        else if (!meltdownPopupOpen && meltdownDialogRef.current) { meltdownDialogRef.current.close(); }
    }, [meltdownPopupOpen]);

    const rerollHitLocation = () => { setHitLocationRoll(rollD20()); };

    const getMeltdownDiceCount = () => Math.floor(getDamageRating() / 2);

    const rollMeltdownDice = () => {
        const diceCount = getMeltdownDiceCount();
        const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setMeltdownDiceValues(rolls);
    };

    const getMeltdownEffectCount = () => { return meltdownDiceValues.filter(roll => roll >= 3 && roll <= 4).length; };

    const closeMeltdownPopup = () => {
        setMeltdownPopupOpen(false);
        setMeltdownUsed(true);
        setMeltdownDiceValues([]);
    };

    if(!dataManager.isType(weaponData, "weapon")){ return null; }

    const hasBurst = (weaponData?.EFFECTS || []).includes('effectBurst');

    const getCurrentAmmo = () => {
        let ammoId = weaponData.AMMO_TYPE;
        if (ammoId === 'self') { ammoId = weaponData.ID; }
        if (ammoId === 'na') { return 0; }
        const ammoItem = character.items.find(item => item.id === ammoId);
        return ammoItem ? ammoItem.quantity : 0;
    };

    const getExtraHitsType = () => {
        if (!weaponData) { return null; }
        if (isMelee(weaponData.CATEGORY)) { return 'ap'; }
        if (Number(weaponData.FIRE_RATE) > 0) { return 'ammo'; }
        return null;
    };

    const getActiveDiceCount = () => diceActive.filter(Boolean).length;
    const getActiveExtraDiceCount = () => extraDiceActive.filter(Boolean).length;
    const getActiveCount = () => getActiveDiceCount() + getActiveExtraDiceCount();

    const getRerolledDiceCount = () => diceRerolled.filter(Boolean).length;
    const getRerolledExtraDiceCount = () => extraDiceRerolled.filter(Boolean).length;
    const getRerolledCount = () => getRerolledDiceCount() + getRerolledExtraDiceCount();

    const getLuckCost = () => {
        if (!hasRolled) { return 0; }
        const rerolledCount = getRerolledCount();
        const payedLeftover = rerolledCount % 3;
        const freeRerolls = payedLeftover > 0 ? 3 - payedLeftover : 0;
        const luckCost = Math.ceil((getActiveCount() - freeRerolls) / 3);
        return Math.max(0, luckCost);
    };

    const getDiceClassFromRoll = (roll: number) => {
        if (roll >= 5) { return 'd6-face-blank'; }
        if (roll >= 3) { return 'd6-face-effect'; }
        if (roll >= 2) { return 'd6-face-damage2'; }
        return 'd6-face-damage1';
    };

    const getEffectCount = () => { return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-effect').length; };
    const getDamage1Count = () => { return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-damage1').length; };
    const getDamage2Count = () => { return [...diceClasses, ...extraDiceClasses].filter(c => c === 'd6-face-damage2').length; };

    const getTotalDamage = () => {
        if (!hasRolled) { return '?'; }
        const effects = getEffectCount();
        const damage1 = getDamage1Count();
        const damage2 = getDamage2Count();
        if(weaponData.EFFECTS?.includes('effectVicious')){
            const baseDamage = effects + damage1 + damage2 * 2;
            return `${baseDamage + effects} (${baseDamage}+${effects})`
        }
        return effects + damage1 + damage2 * 2;
    };

    const getTotalEffects = () => {
        if (!hasRolled) { return '?'; }
        return getEffectCount();
    };

    const handleDiceClick = (index: number) => {
        if (hasRolled && !diceRerolled[index]) {
            setDiceActive(prev => {
                const newActive = [...prev];
                newActive[index] = !newActive[index];
                return newActive;
            });
        }
    };

    const handleExtraDiceClick = (index: number) => {
        if (!hasRolled) {
            const isActivating = !extraDiceActive[index];
            let ammoId = weaponData?.AMMO_TYPE;
            if (ammoId === 'self') { ammoId = weaponData?.ID; }
            if (ammoId === 'na') { ammoId = undefined; }
            const hitsType = getEffectiveExtraHitsType();
            if (hitsType === 'ammo' && isActivating && ammoId) {
                const currentAmmo = character.items.find(item => item.id === ammoId)?.quantity ?? 0;
                if (currentAmmo < ammoCost + ammoStep) {
                    alert(t('notEnoughAmmoAlert') || 'Not enough ammo!');
                    return;
                }
            }
            setExtraDiceActive(prev => {
                const newActive = [...prev];
                newActive[index] = !newActive[index];
                if (isGatling) {
                    const indexOffset = index % 2 === 0 ? 1 : -1;
                    newActive[index + indexOffset] = newActive[index];
                }
                return newActive;
            });
            if (hitsType === 'ammo' && ammoId) { setAmmoCost(prev => prev + (isActivating ? 1 : -1) * ammoStep); }
        } else {
            if (extraDiceClasses[index] && !extraDiceRerolled[index]) {
                setExtraDiceActive(prev => {
                    const newActive = [...prev];
                    newActive[index] = !newActive[index];
                    return newActive;
                });
            }
        }
    };

    const handleRoll = () => {
        if (getActiveCount() === 0) {
            alert(t('selectDiceAlert'));
            return;
        }
        const luckCost = getLuckCost();
        if (character.currentLuck < luckCost) {
            alert(t('notEnoughLuckAlert'));
            return;
        }

        const newClasses = [...diceClasses];
        const newRerolled = [...diceRerolled];
        diceActive.forEach((isActive, index) => {
            if (isActive) {
                const roll = Math.floor(Math.random() * 6) + 1;
                newClasses[index] = getDiceClassFromRoll(roll);
                if (hasRolled) { newRerolled[index] = true; }
            }
        });
        setDiceClasses(newClasses);
        setDiceRerolled(newRerolled);
        setDiceActive(new Array(damageRating).fill(false));

        const newExtraClasses = [...extraDiceClasses];
        const newExtraRerolled = [...extraDiceRerolled];
        extraDiceActive.forEach((isActive, index) => {
            if (isActive) {
                const roll = Math.floor(Math.random() * 6) + 1;
                newExtraClasses[index] = getDiceClassFromRoll(roll);
                if (hasRolled) { newExtraRerolled[index] = true; }
            }
        });
        setExtraDiceClasses(newExtraClasses);
        setExtraDiceRerolled(newExtraRerolled);
        setExtraDiceActive(new Array(extraDiceCount).fill(false));

        if (!hasRolled) {
            let ammoId = weaponData?.AMMO_TYPE;
            if (ammoId === 'self') { ammoId = weaponData?.ID; }
            if (ammoId && ammoId !== 'na') {
                updateCharacter({
                    items: character.items
                        .map(item => item.id === ammoId ? { ...item, quantity: item.quantity - ammoCost } : item)
                        .filter(item => item.quantity > 0),
                });
                setAmmoPayed(ammoCost);
                setAmmoCost(0);
            }
        }

        setLuckPayed(prev => prev + luckCost);
        if (luckCost > 0) { updateCharacter({ currentLuck: character.currentLuck - luckCost }); }

        setHasRolled(true);
    };

    const callback = () => {
        if (burstEffectsUsed > 0 && weaponData && !isMelee(weaponData.CATEGORY)) {
            let ammoId = weaponData.AMMO_TYPE;
            if (ammoId === 'self') { ammoId = weaponData.ID; }
            if (ammoId && ammoId !== 'na') {
                updateCharacter({
                    items: character.items
                        .map(item => item.id === ammoId ? { ...item, quantity: item.quantity - burstEffectsUsed } : item)
                        .filter(item => item.quantity > 0),
                });
            }
        }
    };

    const { closeWithAnimation } = useDialog(dialogRef, onClose);

    if (!weaponData) { return null; }

    const extraHitsType = getEffectiveExtraHitsType();

    return (
        <DialogPortal>
        <dialog ref={dialogRef} style={{ minWidth: '300px', maxWidth: '320px' }}>
            <PopupHeader title={weaponData.ID} onClose={() => closeWithAnimation(callback)}/>

            <div style={{ marginBottom: '0.25rem' }}>
                <div className="h4" style={{ marginBottom: '0.25rem' }}>
                    {t('damage')}: {t(weaponData.DAMAGE_TYPE)}
                </div>

                {(weaponData.EFFECTS?.length > 0 || weaponData.QUALITIES?.length > 0) && (
                    <div className="row" style={{ flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                        {weaponData.EFFECTS?.map(effect => {
                            const [effectType, effectOpt] = effect.split(':');
                            let displayValue = t(effectOpt!);
                            if (displayValue) { displayValue = ` ${displayValue}`; }
                            const displayText = `${t(effectType!)}${displayValue}`;
                            return (
                                <Tag key={effect} tooltipId={`${effectType}Description`}>
                                    {displayText}
                                </Tag>
                            );
                        })}

                        {weaponData.QUALITIES?.map(effect => {
                            const [qualityType, qualityOpt] = effect.split(':');
                            let displayValue = t(qualityOpt!);
                            if (displayValue) { displayValue = ` ${displayValue}`; }
                            const displayText = `${t(qualityType!)}${displayValue}`;
                            return (
                                <Tag key={effect} isEmpty={true} tooltipId={`${qualityType}Description`}>
                                    {displayText}
                                </Tag>
                            );
                        })}
                    </div>
                )}
            </div>

            <hr style={{ margin: '0.25rem 0' }} />

            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{t('hitLocation')}:</span>
            <div className="row" style={{ gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                <select
                    value={creatureType}
                    onChange={e => setCreatureType(e.target.value as CreatureType)}
                    style={{ padding: '0.125rem 0.25rem', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', border: 'var(--border-primary-thin)', fontSize: '0.85rem', borderRadius: '0.25rem', flex: 1, minWidth: '80px' }}
                >
                    <option value="humanoid">{t('humanoid')}</option>
                    <option value="mrHandy">{t('mrHandy')}</option>
                </select>
                <span style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', minWidth: 0, fontSize: '0.95rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {t(hitLocation)}
                </span>
                <button onClick={rerollHitLocation} style={{ padding: '0.125rem 0.375rem', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', border: 'var(--border-primary-thin)', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', }} title={t('rerollHitLocation')}>
                    <i className="fas fa-dice"></i>
                </button>
            </div>

            <hr style={{ margin: '0.25rem 0' }} />

            <div style={{ marginBottom: '0.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, 2.5rem)', gap: '0.25rem', justifyContent: 'center', minHeight: '2.5rem', marginBottom: extraDiceCount > 0 ? '0.5rem' : '0' }}>
                    {diceClasses.map((diceClass, index) => (
                        <div key={index} className={`d6-dice dice ${diceClass || ''} ${diceActive[index] ? 'active' : ''} ${diceRerolled[index] ? 'rerolled' : ''}`} onClick={() => handleDiceClick(index)} style={{ cursor: hasRolled && !diceRerolled[index] ? 'pointer' : 'default', }} >
                            {diceClass ? '' : '?'}
                        </div>
                    ))}
                </div>

                {extraDiceCount > 0 && (
                    <>
                        <div className="row" style={{ justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            <span>{t('extraHits')}</span>
                            {canChooseExtraHitsType ? (
                                <select value={extraHitsType || 'ap'} onChange={e => setChosenExtraHitsType(e.target.value as 'ap' | 'ammo')} disabled={hasRolled} style={{ padding: '0.125rem 0.25rem', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', border: 'var(--border-primary-thin)', fontSize: '0.85rem', borderRadius: '0.25rem', }} >
                                    <option value="ap">[{t('ap')}]</option>
                                    <option value="ammo">[{t('ammo')}]</option>
                                </select>
                            ) : (
                                <span>[{t(extraHitsType)}]</span>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, 2.5rem)', gap: '0.25rem', justifyContent: 'center', minHeight: '2.5rem' }}>
                            {extraDiceClasses.map((diceClass, index) => (
                                <div key={index} className={`d6-dice dice ${diceClass || ''} ${extraDiceActive[index] ? 'active' : ''} ${extraDiceRerolled[index] ? 'rerolled' : ''}`} onClick={() => handleExtraDiceClick(index)} style={{ cursor: !hasRolled || (diceClass && !extraDiceRerolled[index]) ? 'pointer' : 'default', }} >
                                    {diceClass ? '' : '?'}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <hr style={{ margin: '0.25rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem' }}>{t('totalDamage')}</div>
                    <div className="h2" style={{ margin: 0 }}>{getTotalDamage()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem' }}>{t('totalEffects')}</div>
                    <div className="h2" style={{ margin: 0 }}>{getTotalEffects()}</div>
                </div>
            </div>

            <hr style={{ margin: '0.25rem 0' }} />

            {!isMysteriousStranger && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: !isMelee(weaponData.CATEGORY) ? '1fr 1fr' : '1fr', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        {!isMelee(weaponData.CATEGORY) && (
                            <div className="row" style={{ justifyContent: 'space-between' }}>
                                <span>{t('ammo')}:</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', }}>
                                    {!hasRolled ? (
                                        <span>{ammoCost} / {getCurrentAmmo()}</span>
                                    ) : hasBurst ? (
                                        <>
                                            <select value={burstEffectsUsed} onChange={e => setBurstEffectsUsed(parseInt(e.target.value))} style={{ padding: '0.125rem 0.25rem', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', border: 'var(--border-primary-thin)', fontSize: '0.85rem', }} >
                                                {Array.from({ length: Math.min(getEffectCount(), getCurrentAmmo()) + 1, }, (_, i) => (
                                                    <option key={i} value={i}>{i}</option>
                                                ))}
                                            </select>
                                            <span>/ {getCurrentAmmo()}</span>
                                        </>
                                    ) : (
                                        <span>0 / {getCurrentAmmo()}</span>
                                    )}
                                </span>
                            </div>
                        )}

                        <div className="row" style={{ justifyContent: 'space-between' }}>
                            <span>{t('luck')}:</span>
                            <span>{getLuckCost()} / {character.currentLuck}</span>
                        </div>
                    </div>

                    <hr style={{ margin: '0.25rem 0' }} />
                </>
            )}

            <footer>
                {(!hasRolled || !(diceRerolled.every(Boolean) && extraDiceRerolled.every(Boolean))) && (
                    <button className="popup__button-confirm" onClick={handleRoll} disabled={!isMelee(weaponData.CATEGORY) && getCurrentAmmo() < ammoCost} >
                        {hasRolled ? t('reroll') : t('roll')}
                    </button>
                )}

                {!isMysteriousStranger && !isMelee(weaponData.CATEGORY) && character.perks.includes('perkGunFu') && !gunFuUsed && (
                    <button className="popup__button-confirm" onClick={() => {
                        const totalDamage = getTotalDamage();
                        showConfirm(`${t('perkGunFu')}

${'${t(\'damage\')}: ${totalDamage}\n\n'}${'${t(\'confirmGunFu\')}'}`, () => {
                            let ammoId = weaponData.AMMO_TYPE;
                            if (ammoId === 'self') { ammoId = weaponData.ID; }
                            if (ammoId && ammoId !== 'na') {
                                updateCharacter({
                                    items: character.items
                                        .map(item => item.id === ammoId ? { ...item, quantity: item.quantity - 1 } : item)
                                        .filter(item => item.quantity > 0),
                                });
                            }
                            setGunFuUsed(true);
                        })
                    }} disabled={!hasRolled || getCurrentAmmo() < 1} title={t('perkGunFuDescription')} >
                        {t('perkGunFu')}
                    </button>
                )}

                {!isMysteriousStranger && isMelee(weaponData.CATEGORY) && character.perks.includes('perkSlayer') && !slayerUsed && (
                    <button className="popup__button-confirm" onClick={() => {
                        showConfirm(`${t('perkSlayer')}

${'${t(\'confirmSlayer\')}'}`, () => { updateCharacter({ currentLuck: character.currentLuck - 1 }); setSlayerUsed(true); })
                    }} disabled={!hasRolled || character.currentLuck < 1} title={t('perkSlayerDescription')} >
                        {t('perkSlayer')}
                    </button>
                )}

                {!isMysteriousStranger && weaponData.CATEGORY === 'energyWeapons' && character.perks.includes('perkMeltdown') && !meltdownUsed && (
                    <button className="popup__button-confirm" onClick={() => { setMeltdownPopupOpen(true); }} disabled={!hasRolled} title={t('perkMeltdownDescription')} >
                        {t('perkMeltdown')}
                    </button>
                )}

                <button className="popup__button-close" onClick={() => closeWithAnimation(callback)}>
                    {t('close')}
                </button>
            </footer>
        </dialog>

        <dialog ref={meltdownDialogRef} style={{ padding: '1rem', borderRadius: '8px', minWidth: '300px', maxWidth: '500px', }} >
                <PopupHeader title={t('meltdownTitle')} onClose={closeMeltdownPopup} />
                <hr />

                <div style={{ padding: '1rem 0' }}>
                    <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
                        {t('meltdownRollDice', { diceCount: getMeltdownDiceCount() })}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {Array.from({ length: getMeltdownDiceCount() }, (_, index) => {
                            const roll = meltdownDiceValues[index];
                            const diceClass = roll ? getDiceClassFromRoll(roll) : null;
                            return (
                                <div key={index} className={`d6-dice dice ${diceClass || ''}`}>
                                    {diceClass ? '' : '?'}
                                </div>
                            );
                        })}
                    </div>

                    {meltdownDiceValues.length > 0 && (
                        <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
                            {t('meltdownResult', { effectCount: getMeltdownEffectCount(), totalDamage: getMeltdownEffectCount() })}
                        </p>
                    )}
                </div>

                <hr />
                <footer style={{ padding: 0, marginTop: '0.25rem', gap: '0.5rem' }}>
                    <button className="popup__button-confirm" onClick={meltdownDiceValues.length === 0 ? rollMeltdownDice : closeMeltdownPopup}>
                        {meltdownDiceValues.length === 0 ? t('roll') : t('confirm')}
                    </button>
                    <button className="popup__button-close" onClick={closeMeltdownPopup}>
                        {t('close')}
                    </button>
                </footer>
            </dialog>
        </DialogPortal>
    );
}

export default D6Popup

