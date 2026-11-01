import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const chrome =
    process.env.CHROME_PATH ??
    [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ].find(existsSync);
const root = fileURLToPath(new URL('../', import.meta.url));
const entryPath = '/__ui_regressions__/entry.jsx';
const entryId = join(root, entryPath);
const mapLayoutPath = '/__ui_regressions__/map-layout.jsx';
const mapLayoutId = join(root, mapLayoutPath);
const caseNames = [
    'Companion edits preserve perks after switching companion and character',
    'D6 self-ammo consumes only the selected instance',
    'Burst reservations disable incompatible actions and are paid only once',
    'Failed burst payment keeps the dialog open and can be cancelled',
    'Deferred actions recheck resources including reserved burst ammo',
    'Close validation uses the latest burst selection during the animation',
    'Item edits compose with purchases and sales using latest inventory and currencies',
    'Deferred side selection preserves inventory changes and the opposite armor side',
    'Robot plating confirmation preserves intervening items, currency and other part mods',
    'Robot module edits and renaming preserve one saved part after origin changes',
    'New companion edits preserve defaults, name, HP and consecutive SPECIAL changes',
    'Manual feats are implemented in lists and selectors, with actions only while effective',
    'Mother Wasteland confirms once, preserves latest luck and does not charge on cancel',
    'Mother Wasteland does not open without enough luck',
    'Rite of Passage refunds an effect using latest luck and maximum',
    'Rite of Passage ignores non-effects and cancellation',
    'Mysterious Stranger preserves its roller stats and pays only once on the first roll',
    'Mounted maps and region selectors react to persisted settings changes',
    'Map unlocking and deferred deletion preserve the latest location codes',
    'Maps and settings fit responsive panels while preserving map interactions and tab scrolling',
    'Theme metadata follows the selected primary color on changes and startup',
];

const mapLayoutFixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import '/src/styles/index.css';
import '/src/locales/i18n.ts';
import App from '/src/app/App.tsx';
import { CharacterProvider } from '/src/app/contexts/CharacterContext.tsx';
import { PopupProvider } from '/src/app/contexts/PopupContext.tsx';
import { TooltipProvider } from '/src/app/contexts/TooltipContext.tsx';
import { useSaveStore } from '/src/hooks/useSaveStore.ts';
import { UISettingsManager } from '/src/services/UISettingsManager.ts';

window.mapLayoutErrors = [];
window.addEventListener('error', event => window.mapLayoutErrors.push(event.error?.stack ?? event.message));
window.addEventListener('unhandledrejection', event => window.mapLayoutErrors.push(String(event.reason)));
UISettingsManager.setRegion('mojave');
UISettingsManager.applyAll();
useSaveStore.getState().importSlot(0, { origin: 'survivor', mapCodes: ['g00d'] });
useSaveStore.getState().setActiveSlot(0);
createRoot(document.getElementById('root')).render(
    <React.StrictMode><CharacterProvider><TooltipProvider><PopupProvider>
        <App />
    </PopupProvider></TooltipProvider></CharacterProvider></React.StrictMode>
);
`;

const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from '/src/locales/en.json';
import '/src/styles/index.css';
import { CharacterProvider, useCharacter } from '/src/app/contexts/CharacterContext.tsx';
import { PopupProvider, usePopup } from '/src/app/contexts/PopupContext.tsx';
import { TooltipProvider } from '/src/app/contexts/TooltipContext.tsx';
import { useSaveStore } from '/src/hooks/useSaveStore.ts';
import { mod } from '/src/data/index.ts';
import { createDefaultCompanion } from '/src/utils/companionTypes.ts';
import CompanionTab from '/src/app/tabs/companion/CompanionTab.tsx';
import D6Popup from '/src/app/components/popup/dice/D6Popup.tsx';
import ModifyItemPopup from '/src/app/components/popup/ModifyItemPopup.tsx';
import ApparelCard from '/src/app/tabs/inv/cards/apparel/ApparelCard.tsx';
import { useItemManagement } from '/src/app/contexts/useItemManagement.ts';
import { useInventoryActions } from '/src/app/tabs/inv/hooks/useInventoryActions.ts';
import PerkList from '/src/app/tabs/data/components/PerkList.tsx';
import TraitList from '/src/app/tabs/data/components/TraitList.tsx';
import { PerkSelectionPopup, TraitSelectionPopup } from '/src/app/tabs/data/components/FeatSelectionPopup.tsx';
import MapTab from '/src/app/tabs/map/MapTab.tsx';
import SettingsTab from '/src/app/tabs/settings/SettingsTab.tsx';
import { commonwealthMarkers } from '/src/app/tabs/map/commonwealthMarkers.ts';
import { UISettingsManager, THEMES } from '/src/services/UISettingsManager.ts';

await i18next.use(initReactI18next).init({
    lng: 'en', resources: { en: { translation: translations } },
});
const app = createRoot(document.getElementById('root'));
const pause = () => new Promise(resolve => setTimeout(resolve, 30));
const item = (id, extra = {}) => ({ id, quantity: 1, mods: [], equipped: false, ...extra });
const character = (extra = {}) => ({
    origin: 'survivor', level: 30, currentLuck: 8,
    special: { strength: 8, perception: 8, endurance: 8, charisma: 8, intelligence: 8, agility: 10, luck: 8 },
    ...extra,
});
let context, popup, itemManagement, inventoryActions, closed = 0, alerts = [];
const runtimeErrors = [];
window.alert = message => alerts.push(message);
window.addEventListener('error', e => runtimeErrors.push(e.error?.stack ?? e.message));
window.addEventListener('unhandledrejection', e => runtimeErrors.push(String(e.reason)));
Math.random = () => 0.4;

function check(value, message) {
    if (!value) throw new Error(message);
}
async function waitFor(predicate, message) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await pause();
    }
    throw new Error(message);
}
function Bridge() {
    context = useCharacter();
    popup = usePopup();
    itemManagement = useItemManagement();
    inventoryActions = useInventoryActions();
    return null;
}
function mount(view, props = {}) {
    app.render(<React.StrictMode><CharacterProvider><TooltipProvider><PopupProvider>
        <Bridge />
        {view === 'companion' && <CompanionTab />}
        {view === 'd6' && <D6Popup {...props} onClose={() => { closed++; mount('empty'); }} />}
        {view === 'modify' && <ModifyItemPopup {...props} onClose={() => { closed++; mount('empty'); }} />}
        {view === 'apparel' && <ApparelCard {...props} />}
        {view === 'feats' && <><PerkList /><TraitList /></>}
        {view === 'perk-selection' && <PerkSelectionPopup prev={undefined} onSelect={() => {}} onClose={() => mount('empty')} />}
        {view === 'trait-selection' && <TraitSelectionPopup prev={undefined} onSelect={() => {}} onClose={() => mount('empty')} />}
        {view === 'map-settings' && <>
            <div hidden><SettingsTab /></div>
            <main className="map-panel"><MapTab /></main>
        </>}
    </PopupProvider></TooltipProvider></CharacterProvider></React.StrictMode>);
}
async function reset(raw, view, props) {
    app.render(null);
    await pause();
    alerts = [];
    closed = 0;
    Math.random = () => 0.4;
    useSaveStore.getState().importSlot(0, character(raw));
    useSaveStore.getState().setActiveSlot(0);
    mount(view, props);
    await pause();
}
function raw() {
    const state = useSaveStore.getState();
    return state.slots[state.activeSlot];
}
function select(input, value) {
    check(input, 'Missing select');
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return pause();
}
function changeInput(input, value) {
    check(input, 'Missing input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return pause();
}
function gunFu() {
    return [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Gun Fu');
}
function burstSelect() {
    return [...document.querySelectorAll('dialog:first-of-type select')]
        .find(s => [...s.options].some(o => o.value === '1'));
}
async function finishClose(dialog, button = dialog.querySelector('button.closeButton')) {
    button.click();
    dialog.dispatchEvent(new Event('animationend', { bubbles: true }));
    await pause();
}
async function activateFeat(label) {
    const button = [...document.querySelectorAll('.perk-action-button')]
        .find(b => b.title === i18next.t(label));
    check(button, 'Missing manual action: ' + label);
    button.click();
    await pause();
    return document.querySelector('dialog:last-of-type');
}
async function setupBurst(quantity = 2) {
    await reset({
        perks: ['perkGunFu'],
        items: [item('weaponAssaultRifle'), item('ammo556mm', { quantity })],
    }, 'd6', { usingItem: item('weaponAssaultRifle') });
    document.querySelector('dialog:first-of-type button.confirmButton').click();
    await pause();
    await select(burstSelect(), '1');
}
const cases = [
    async () => {
        const dog = { ...createDefaultCompanion('dog'), perks: [] };
        const eyebot = { ...createDefaultCompanion('eyebot'), perks: ['companionPerkASenseForDanger'] };
        await reset({
            perks: ['perkDogmeat', 'perkRobotWrangler'],
            companions: { dog, eyebot }, activeCompanionId: 'dog',
        }, 'companion');
        await select(document.querySelector('select'), 'eyebot');
        await select(document.querySelectorAll('select')[2], 'companionPerkCoordinated');
        check(JSON.stringify(raw().companions.eyebot.perks) === JSON.stringify([
            'companionPerkASenseForDanger', 'companionPerkCoordinated',
        ]), 'Switching companion lost a saved perk');
        check(raw().companions.dog.perks.length === 0, 'Another companion was overwritten');
        context.importSlot(1, character({
            perks: ['perkRobotWrangler'],
            companions: { eyebot: { ...eyebot, perks: ['companionPerkCoordinated'] } },
            activeCompanionId: 'eyebot',
        }));
        context.setActiveSlot(1);
        await pause();
        await select(document.querySelectorAll('select')[2], 'companionPerkASenseForDanger');
        check(JSON.stringify(raw().companions.eyebot.perks) === JSON.stringify([
            'companionPerkCoordinated', 'companionPerkASenseForDanger',
        ]), 'Switching character reused the previous companion state');
    },
    async () => {
        const selected = item('weaponAtomicMine', { customName: 'Selected mine' });
        await reset({
            items: [item(selected.id, { customName: 'Other mine', quantity: 2 }), selected],
        }, 'd6', { usingItem: selected });
        check(document.body.textContent.includes('1 / 1'), 'Ammo availability combined different configurations');
        document.querySelector('dialog:first-of-type button.confirmButton').click();
        await pause();
        check(!raw().items.some(i => i.customName === 'Selected mine'), 'Selected mine was not consumed');
        check(raw().items.find(i => i.customName === 'Other mine')?.quantity === 2, 'Another stack was consumed');
        await finishClose(document.querySelector('dialog'));
        check(closed === 1, 'Self-ammo dialog failed to close');
    },
    async () => {
        await setupBurst();
        check(gunFu().disabled, 'Gun Fu ignored reserved ammo');
        gunFu().click();
        await pause();
        check(raw().items.find(i => i.id === 'ammo556mm')?.quantity === 1, 'Disabled action spent ammo');
        const dialog = document.querySelector('dialog');
        const close = dialog.querySelector('button.closeButton');
        close.click();
        close.click();
        dialog.dispatchEvent(new Event('animationend', { bubbles: true }));
        await pause();
        check(closed === 1, 'Repeated close completed more than once');
        check(!raw().items.some(i => i.id === 'ammo556mm'), 'Burst was not paid exactly once');
    },
    async () => {
        await setupBurst();
        context.updateCharacter(prev => ({ items: prev.items.filter(i => i.id !== 'ammo556mm') }));
        await pause();
        check(burstSelect()?.value === '1', 'Unpaid burst was silently reset in the UI');
        const dialog = document.querySelector('dialog');
        await finishClose(dialog);
        check(dialog.open && closed === 0, 'Failed payment hid or removed the dialog');
        check(alerts.length === 1, 'Failed payment did not notify the user');
        await select(burstSelect(), '0');
        const cancel = new Event('cancel', { cancelable: true });
        dialog.dispatchEvent(cancel);
        check(cancel.defaultPrevented && dialog.open, 'Escape bypassed the close lifecycle');
        dialog.dispatchEvent(new Event('animationend', { bubbles: true }));
        await pause();
        check(closed === 1 && !dialog.isConnected, 'Cancelling burst did not allow closing');
    },
    async () => {
        await setupBurst(3);
        check(!gunFu().disabled, 'Funded action was disabled');
        gunFu().click();
        await pause();
        context.updateCharacter(prev => ({
            items: prev.items.map(i => i.id === 'ammo556mm' ? { ...i, quantity: 1 } : i),
        }));
        await pause();
        let confirm = document.querySelector('dialog:last-of-type');
        await finishClose(confirm, confirm.querySelector('button.confirmButton'));
        check(alerts.length === 1, 'Deferred confirmation did not recheck the reservation');
        check(raw().items.find(i => i.id === 'ammo556mm')?.quantity === 1, 'Failed action consumed ammo');
        await select(burstSelect(), '0');
        check(!gunFu().disabled, 'Failed action consumed its usage');
        gunFu().click();
        await pause();
        confirm = document.querySelector('dialog:last-of-type');
        await finishClose(confirm, confirm.querySelector('button.confirmButton'));
        check(!raw().items.some(i => i.id === 'ammo556mm'), 'Confirmed action did not spend ammo');
        await finishClose(document.querySelector('dialog'));
        check(closed === 1, 'D6 did not close after a successful confirmation');
    },
    async () => {
        await setupBurst();
        const dialog = document.querySelector('dialog');
        dialog.querySelector('button.closeButton').click();
        await select(burstSelect(), '0');
        dialog.dispatchEvent(new Event('animationend', { bubbles: true }));
        await pause();
        check(closed === 1, 'Updated close validation did not finish closing');
        check(raw().items.find(i => i.id === 'ammo556mm')?.quantity === 1, 'Stale close callback charged a cancelled burst');
    },
    async () => {
        const manual = item('weaponTenMillimeterPistol', { customName: 'Original', quantity: 2 });
        const hidden = item(manual.id, { grantedBy: 'inactiveFeat', customName: 'Hidden', mods: ['legendaryFreezing'] });
        const custom = { customName: 'Souvenir', quantity: 2, COST: 3, WEIGHT: 1, RARITY: 0, CATEGORY: 'misc', TYPE: 'other' };
        await reset({
            items: [manual, hidden], customItems: [custom],
            caps: 100, ncrDollars: 80, legionDenarius: 60, prewarMoney: 40,
        }, 'empty');
        const actions = itemManagement;
        const hiddenBefore = JSON.stringify(raw().items.find(i => i.grantedBy === 'inactiveFeat'));
        actions.addItem(item('ammo556mm', { quantity: 5 }), { caps: 10, ncrDollars: 4, legionDenarius: 3, prewarMoney: 2 });
        actions.editItem({ ...manual, quantity: 1 }, { ...manual, quantity: 1, customName: 'Renamed' }, { caps: 5, ncrDollars: 2 });
        actions.removeItem(item('ammo556mm', { quantity: 2 }), { caps: 4, legionDenarius: 1 });
        actions.editItem({ ...custom, quantity: 1 }, { ...custom, quantity: 1, customName: 'Renamed souvenir' }, { caps: 3, prewarMoney: 1 });
        await pause();
        const saved = raw();
        check(saved.caps === 86 && saved.ncrDollars === 74 && saved.legionDenarius === 58 && saved.prewarMoney === 37, 'Sequential edits overwrote currency changes');
        check(saved.items.find(i => i.id === 'ammo556mm')?.quantity === 3, 'An edit lost a purchase or sale');
        check(saved.items.find(i => i.customName === 'Original')?.quantity === 1, 'Editing one item changed the original stack');
        check(saved.items.find(i => i.customName === 'Renamed')?.quantity === 1, 'Item edit was lost');
        check(JSON.stringify(saved.items.find(i => i.grantedBy === 'inactiveFeat')) === hiddenBefore, 'Item edits changed hidden grants');
        check(saved.customItems.some(i => i.customName === 'Souvenir' && i.quantity === 1), 'Custom item edit lost the remaining stack');
        check(saved.customItems.some(i => i.customName === 'Renamed souvenir' && i.quantity === 1), 'Custom item edit was lost');
    },
    async () => {
        const armor = item('armorCombatArm', { quantity: 2 });
        await reset({
            items: [
                armor,
                item('armorLeatherArm', { equipped: true, side: 'left' }),
                item('armorLeatherArm', { equipped: true, side: 'right' }),
                item('weaponMrHandyPliers', { grantedBy: 'inactiveFeat' }),
            ],
        }, 'empty');
        inventoryActions.equipItem(armor);
        await pause();
        context.updateCharacter(prev => ({ items: [...prev.items, item('ammo556mm', { quantity: 3 })] }));
        await pause();
        const left = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === i18next.t('left'));
        check(left, 'Missing side selection');
        left.click();
        await pause();
        const saved = raw().items;
        check(saved.find(i => i.id === 'ammo556mm')?.quantity === 3, 'Side selection overwrote intervening inventory changes');
        check(saved.some(i => i.id === armor.id && i.equipped && i.side === 'left' && i.quantity === 1), 'Selected armor was not equipped on the chosen side');
        check(saved.some(i => i.id === armor.id && !i.equipped && i.quantity === 1), 'Equipping a stack lost the remaining item');
        check(saved.some(i => i.id === 'armorLeatherArm' && !i.equipped), 'Conflicting left armor remained equipped');
        check(saved.some(i => i.id === 'armorLeatherArm' && i.equipped && i.side === 'right'), 'Equipping left armor unequipped right armor');
        check(saved.some(i => i.grantedBy === 'inactiveFeat'), 'Equipping armor removed a hidden grant');
    },
    async () => {
        const body = item('robotPartBody', { equipped: true, mods: ['modRobotPlatingStandard'] });
        await reset({ origin: 'mrHandy', items: [body], caps: 100 }, 'modify', { characterItem: body });
        const plating = [...document.querySelectorAll('select')].find(s =>
            [...s.options].some(o => o.value === 'modRobotPlatingMisterGutsy'));
        await select(plating, 'modRobotPlatingMisterGutsy');
        const dialog = document.querySelector('dialog');
        dialog.querySelector('button.confirmButton').click();
        check(raw().items.some(i => i.id === 'robotPartThrusters'), 'Missing realistic robot thrusters fixture');
        context.updateCharacter(prev => ({
            items: [
                ...prev.items.map(i => i.id === 'robotPartThrusters'
                    ? { ...i, customName: 'Latest thrusters', mods: [...i.mods, 'modRobotFactoryArmorThrusters'] }
                    : i),
                item('ammo556mm', { quantity: 3 }),
            ],
            caps: 87,
        }));
        await pause();
        dialog.dispatchEvent(new Event('animationend', { bubbles: true }));
        await pause();
        const saved = raw();
        check(closed === 1, 'Mod confirmation did not finish');
        check(saved.caps === 87, 'Plating confirmation overwrote intervening currency changes');
        check(saved.items.find(i => i.id === 'ammo556mm')?.quantity === 3, 'Plating confirmation lost intervening inventory changes');
        const thrusters = saved.items.find(i => i.id === 'robotPartThrusters');
        check(thrusters?.customName === 'Latest thrusters' && thrusters.mods.includes('modRobotFactoryArmorThrusters'), 'Plating confirmation overwrote another part configuration');
        check(saved.items.filter(i => i.id.startsWith('robotPart')).every(i =>
            i.mods.includes('modRobotPlatingMisterGutsy') && !i.mods.includes('modRobotPlatingStandard')),
            'Plating was not replaced on all current robot parts');
    },
    async () => {
        await reset({
            origin: 'mrHandy',
            items: [item('robotPartBody', {
                mods: ['modRobotPlatingStandard'],
                customName: 'Saved body',
            })],
            caps: 100,
        }, 'empty');
        check(raw().items.find(i => i.id === 'robotPartBody')?.equipped,
            'Loading did not normalize the saved intrinsic part');
        context.updateCharacter({ origin: 'survivor' });
        await pause();
        check(!context.character.items.some(i => i.id === 'robotPartBody'),
            'Changing origin did not hide the body');
        check(raw().items.find(i => i.id === 'robotPartBody')?.equipped,
            'Changing origin altered the hidden body equipped state');
        context.updateCharacter({ origin: 'mrHandy' });
        await pause();
        const body = context.character.items.find(i => i.id === 'robotPartBody');
        mount('apparel', { characterItem: body });
        await pause();
        const equip = document.querySelector('.card-action-btn--primary');
        check(equip?.disabled, 'Intrinsic body part can be manually unequipped');
        const before = JSON.stringify(raw().items);
        equip.click();
        inventoryActions.equipItem(body);
        await pause();
        check(JSON.stringify(raw().items) === before, 'Equip action changed the body');

        mount('modify', { characterItem: body });
        await pause();
        const module = [...document.querySelectorAll('select')].find(s =>
            [...s.options].some(o => o.value === 'modRobotLockpickingModule'));
        await select(module, 'modRobotLockpickingModule');
        context.updateCharacter(prev => ({
            items: [...prev.items, item('ammo556mm', { quantity: 3 })],
            caps: 87,
        }));
        await pause();
        const dialog = document.querySelector('dialog');
        await finishClose(dialog, dialog.querySelector('button.confirmButton'));
        let bodies = raw().items.filter(i => i.id === 'robotPartBody');
        check(bodies.length === 1 && bodies[0].quantity === 1,
            'Editing a module duplicated the body: ' + JSON.stringify(bodies));
        check(bodies[0].equipped && bodies[0].mods.includes('modRobotLockpickingModule'),
            'Module edit did not preserve the intrinsic equipped state and selected module');
        check(raw().caps === 87 - mod.modRobotLockpickingModule.COST,
            'Module edit did not deduct its cost from the latest caps: ' + raw().caps);
        check(raw().items.find(i => i.id === 'ammo556mm')?.quantity === 3,
            'Module edit changed ammo stacks: ' + JSON.stringify(
                raw().items.filter(i => i.id === 'ammo556mm')));

        itemManagement.updateItemCustomName(
            context.character.items.find(i => i.id === 'robotPartBody'), 'Renamed body');
        await pause();
        context.updateCharacter({ origin: 'survivor' });
        await pause();
        context.updateCharacter({ origin: 'mrHandy' });
        await pause();
        bodies = raw().items.filter(i => i.id === 'robotPartBody');
        check(bodies.length === 1 && bodies[0].quantity === 1,
            'Renaming or restoring the body duplicated it');
        check(bodies[0].customName === 'Renamed body' &&
            bodies[0].mods.includes('modRobotLockpickingModule'),
            'Origin changes lost the saved name or module');
    },
    async () => {
        await reset({ perks: ['perkDogmeat'] }, 'companion');
        check(!raw().companions.dog, 'Fixture should start with an unsaved default companion');
        await select(document.querySelectorAll('select')[2], 'companionPerkASenseForDanger');
        check(raw().companions.dog?.perks.includes('companionPerkASenseForDanger'), 'First perk edit did not save the default companion');
        await changeInput(document.querySelector('input[type="text"]'), 'First saved dog');
        check(raw().companions.dog?.name === 'First saved dog', 'First name edit did not save the default companion');
        await changeInput(document.querySelector('input[type="number"]'), '2');
        const body = raw().companions.dog.special.body;
        const edit = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === i18next.t('editStats'));
        check(edit, 'Missing companion edit button');
        edit.click();
        await pause();
        const gear = document.querySelector('#c-special .special');
        gear.click();
        gear.click();
        await pause();
        check(raw().companions.dog.special.body === body + 2, 'Consecutive SPECIAL changes reused a rendered snapshot');
        check(raw().companions.dog.special.mind === 3, 'Companion edit lost the default MIND');
        check(raw().companions.dog.name === 'First saved dog' && raw().companions.dog.currentHp === 2, 'SPECIAL editing overwrote companion name or HP');
        check(raw().companions.dog.perks.includes('companionPerkASenseForDanger'), 'Companion edits overwrote saved perks');
    },
    async () => {
        const ids = ['perkMysteriousStranger', 'traitMotherWasteland', 'traitRiteOfPassage'];
        await reset({
            origin: 'tribal', perks: [ids[0]], traits: ids.slice(1),
        }, 'feats');
        for (const id of ids) {
            const name = [...document.querySelectorAll('.inventory-row__name span')]
                .find(n => n.textContent.trim() === i18next.t(id));
            check(name && name.style.textDecoration !== 'line-through', 'Manual feat is still marked unimplemented: ' + id);
        }
        check(document.querySelectorAll('.perk-action-button').length === 3, 'Expected exactly the three owned manual actions');
        context.updateCharacter({ origin: 'survivor', special: { luck: 6 } });
        await pause();
        check(document.querySelectorAll('.perk-action-button').length === 0, 'Invalidated feats kept manual actions');
        for (const view of ['perk-selection', 'trait-selection']) {
            await reset({ origin: 'tribal' }, view);
            for (const id of view === 'perk-selection' ? ids.slice(0, 1) : ids.slice(1)) {
                const name = [...document.querySelectorAll('.trait-perk-popup__item-name')]
                    .find(n => n.textContent.trim() === i18next.t(id));
                check(name && name.style.textDecoration !== 'line-through', 'Selector marks manual feat unimplemented: ' + id);
            }
        }
    },
    async () => {
        await reset({ origin: 'tribal', traits: ['traitMotherWasteland'], currentLuck: 5 }, 'feats');
        let dialog = await activateFeat('traitMotherWasteland');
        check(raw().currentLuck === 5, 'Opening Mother Wasteland spent luck');
        await finishClose(dialog);
        check(raw().currentLuck === 5, 'Cancelling Mother Wasteland spent luck');
        dialog = await activateFeat('traitMotherWasteland');
        context.updateCharacter({ currentLuck: 4 });
        await pause();
        const confirm = dialog.querySelector('button.confirmButton');
        confirm.click();
        confirm.click();
        context.updateCharacter({ currentLuck: 3, caps: 87 });
        await pause();
        dialog.dispatchEvent(new Event('animationend', { bubbles: true }));
        await pause();
        check(raw().currentLuck === 2, 'Confirmation did not deduct exactly once from the latest luck');
        check(raw().caps === 87, 'Manual action overwrote an intervening character update');
    },
    async () => {
        await reset({ origin: 'tribal', traits: ['traitMotherWasteland'], currentLuck: 0 }, 'feats');
        const dialog = await activateFeat('traitMotherWasteland');
        check(dialog.textContent.includes(i18next.t('notEnoughLuckAlert')), 'Zero luck did not show the resource alert');
        check(!dialog.querySelector('button.confirmButton') && raw().currentLuck === 0, 'Zero luck still opened a payable confirmation');
    },
    async () => {
        for (const random of [0.4, 0.6]) {
            await reset({ origin: 'tribal', traits: ['traitRiteOfPassage'], currentLuck: 0 }, 'feats');
            Math.random = () => random;
            let dialog = await activateFeat('traitRiteOfPassage');
            check(dialog.querySelectorAll('.d6-dice').length === 1, 'Rite of Passage must roll exactly one combat die');
            dialog.querySelector('button.confirmButton').click();
            await pause();
            check(dialog.querySelector('.d6-face-effect'), 'Expected a combat die effect');
            check(raw().currentLuck === 0, 'Luck was refunded before confirming the result');
            context.updateCharacter({ currentLuck: 5, special: { luck: 6 } });
            await pause();
            await finishClose(dialog, dialog.querySelector('button.confirmButton'));
            check(context.character.maxLuck === 6 && raw().currentLuck === 6, 'Refund did not use latest luck and maximum');
            dialog = await activateFeat('traitRiteOfPassage');
            dialog.querySelector('button.confirmButton').click();
            await pause();
            context.updateCharacter({ special: { luck: 4 } });
            await pause();
            await finishClose(dialog, dialog.querySelector('button.confirmButton'));
            check(raw().currentLuck === 4, 'Rite of Passage exceeded the newly reduced maximum');
        }
    },
    async () => {
        const fixture = { origin: 'tribal', traits: ['traitRiteOfPassage'], currentLuck: 2 };
        let dialog;
        for (const random of [0, 0.2, 0.7, 0.99]) {
            await reset(fixture, 'feats');
            dialog = await activateFeat('traitRiteOfPassage');
            Math.random = () => random;
            dialog.querySelector('button.confirmButton').click();
            await pause();
            check(!dialog.querySelector('.d6-face-effect'), 'Expected a non-effect combat die');
            await finishClose(dialog, dialog.querySelector('button.confirmButton'));
            check(raw().currentLuck === 2, 'A non-effect die refunded luck');
        }
        for (const rolled of [false, true]) {
            await reset(fixture, 'feats');
            dialog = await activateFeat('traitRiteOfPassage');
            if (rolled) {
                dialog.querySelector('button.confirmButton').click();
                await pause();
            }
            await finishClose(dialog);
            check(raw().currentLuck === 2, 'Cancelling the combat die refunded luck');
        }
    },
    async () => {
        await reset({ perks: ['perkMysteriousStranger'], currentLuck: 8 }, 'feats');
        let dialog = await activateFeat('summonStranger');
        check(raw().currentLuck === 8, 'Summoning charged luck before the first roll');
        check(dialog.querySelectorAll('.d20-dice').length === 3, 'Stranger must use three d20s');
        check(dialog.textContent.includes('Target: 16') && dialog.textContent.includes('Critical Hit: Roll \u2264 6'), 'Stranger did not use AGI 10 and tagged Small Guns 6');
        check(dialog.querySelector('select').disabled && dialog.querySelector('select').value === 'agility', 'Stranger SPECIAL selection changed');
        await finishClose(dialog);
        check(raw().currentLuck === 8, 'Cancelling the stranger roll spent luck');
        dialog = await activateFeat('summonStranger');
        const roll = dialog.querySelector('button.confirmButton');
        roll.click();
        roll.click();
        await pause();
        check(raw().currentLuck === 7, 'Stranger first roll must cost exactly one luck');
        check([...dialog.querySelectorAll('.d20-dice')].every(d => d.textContent === '9'), 'Stranger did not roll all three dice');
        check(![...dialog.querySelectorAll('button')].some(b => b.textContent.trim() === i18next.t('roll')), 'Stranger allowed another skill roll');
        dialog.querySelector('button.confirmButton').click();
        await pause();
        const damage = document.querySelector('dialog:last-of-type');
        check(damage !== dialog && damage.querySelector('.d6-dice'), 'Stranger did not continue to its damage popup');
        check(raw().currentLuck === 7, 'Opening stranger damage charged luck again');
        await finishClose(damage);
        await finishClose(dialog);
        check(raw().currentLuck === 7, 'Closing after the stranger roll charged again');
        check(!raw().items.some(i => i.id === 'weaponFortyFourPistol'), 'Stranger weapon leaked into the player inventory');
    },
    async () => {
        UISettingsManager.setRegion('mojave');
        UISettingsManager.setTheme('theme-fallout-3');
        UISettingsManager.setDisplayEffect('off');
        await reset({ mapCodes: ['g00d', commonwealthMarkers[0].code] }, 'map-settings');
        const surface = () => document.querySelector('.map-surface');
        const selector = document.querySelector('#region-select');
        check(surface().style.backgroundImage.includes('/img/png/map.png'),
            'Initial region did not load from persisted settings');
        const initialCodes = JSON.stringify(raw().mapCodes);
        const initialSettings = JSON.parse(localStorage.getItem('PB3K_settings'));
        const oldSurface = surface();
        await select(selector, 'commonwealth');
        check(surface().style.backgroundImage.includes('Commonwealth.webp') && !oldSurface.isConnected,
            'Changing region did not replace the mounted map view');
        check(document.getElementById(commonwealthMarkers[0].code) && !document.getElementById('g00d'),
            'Region markers did not update with the image');
        const persisted = JSON.parse(localStorage.getItem('PB3K_settings'));
        check(persisted.REGION === 'commonwealth' &&
            persisted.THEME === initialSettings.THEME &&
            persisted.CRT_effect === initialSettings.CRT_effect,
            'Region change did not persist or overwrote other settings');

        UISettingsManager.setRegion('capitalWasteland');
        await pause();
        check(selector.value === 'capitalWasteland' &&
            surface().style.backgroundImage.includes('CapitalWasteland.webp'),
            'External region changes did not update both subscribers');
        await changeInput(document.querySelector('.map-unlock-form input'), 'abcd');
        const stored = JSON.stringify({ ...persisted, REGION: 'mojave' });
        localStorage.setItem('PB3K_settings', stored);
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'PB3K_settings', storageArea: localStorage, newValue: stored,
        }));
        await pause();
        check(selector.value === 'mojave' && surface().style.backgroundImage.includes('/img/png/map.png'),
            'Cross-window storage notifications did not update the mounted map');
        check(document.querySelector('.map-unlock-form input').value === '',
            'Changing region retained an unfinished unlock code');
        check(JSON.stringify(raw().mapCodes) === initialCodes, 'Changing region altered saved locations');

        UISettingsManager.setRegion('commonwealth');
        await pause();
        localStorage.removeItem('PB3K_settings');
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'PB3K_settings', storageArea: localStorage,
        }));
        await pause();
        check(selector.value === 'mojave' && surface().style.backgroundImage.includes('/img/png/map.png'),
            'Removing settings did not restore the default region');
        UISettingsManager.setRegion('commonwealth');
        await reset({}, 'map-settings');
        check(surface().style.backgroundImage.includes('Commonwealth.webp'),
            'Remounting the map did not use the persisted region');
    },
    async () => {
        UISettingsManager.setRegion('mojave');
        await reset({ mapCodes: ['g00d'] }, 'map-settings');
        const form = document.querySelector('.map-unlock-form');
        const input = form.querySelector('input');
        await changeInput(input, 'PR1M');
        form.requestSubmit();
        await pause();
        check(raw().mapCodes.includes('pr1m') && input.value === '',
            'Submitting the unlock form did not normalize and save the code');
        await changeInput(input, 'pr1m');
        form.requestSubmit();
        await pause();
        check(raw().mapCodes.filter(code => code === 'pr1m').length === 1,
            'Repeated unlocking duplicated a saved location');
        await changeInput(input, 'zzzz');
        form.requestSubmit();
        await pause();
        check(!raw().mapCodes.includes('zzzz'), 'Invalid code unlocked a location');

        const marker = document.getElementById('g00d').closest('.map-marker');
        marker.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true, button: 0, pointerType: 'touch',
        }));
        await waitFor(() => document.querySelector('dialog'), 'Marker long press did not open confirmation');
        marker.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        context.updateCharacter(prev => ({ mapCodes: [...prev.mapCodes, 'nv4c'] }));
        await pause();
        const dialog = document.querySelector('dialog');
        await finishClose(dialog, dialog.querySelector('button.confirmButton'));
        check(!raw().mapCodes.includes('g00d') &&
            raw().mapCodes.includes('pr1m') && raw().mapCodes.includes('nv4c'),
            'Deferred deletion overwrote intervening location changes');

        UISettingsManager.setRegion('commonwealth');
        await pause();
        const unchanged = JSON.stringify(raw().mapCodes);
        await changeInput(document.querySelector('.map-unlock-form input'), 'g00d');
        document.querySelector('.map-unlock-form').requestSubmit();
        await pause();
        check(JSON.stringify(raw().mapCodes) === unchanged, 'Non-Mojave unlocking changed unexpectedly');
    },
    async () => {
        await reset({}, 'empty');
        const frame = document.createElement('iframe');
        frame.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;border:0';
        frame.src = '/__ui_regressions__/map-layout';
        document.body.append(frame);
        try {
            await waitFor(() => frame.contentDocument?.querySelector('.tab-button'),
                'Map layout app did not mount');
            const doc = frame.contentDocument;
            const win = frame.contentWindow;
            const tab = label => [...doc.querySelectorAll('nav .tab-button')]
                .find(button => button.textContent.trim() === label);
            tab('MAP').click();
            await waitFor(() => doc.querySelector('.map-surface'), 'Map tab did not open');
            const settle = () => new Promise(resolve =>
                win.requestAnimationFrame(() => win.requestAnimationFrame(resolve)));
            const assertFits = label => {
                const panel = doc.querySelector('main.map-panel');
                const viewport = doc.querySelector('.map-viewport');
                const form = doc.querySelector('.map-unlock-form');
                const surface = doc.querySelector('.map-surface');
                const bounds = viewport.getBoundingClientRect();
                const formBounds = form.getBoundingClientRect();
                const panelBounds = panel.getBoundingClientRect();
                const mapBounds = surface.getBoundingClientRect();
                const style = win.getComputedStyle(panel);
                check(bounds.height > 0 && bounds.width > 0, label + ': map has no available space');
                check(panel.scrollHeight <= panel.clientHeight + 1 &&
                    panel.scrollWidth <= panel.clientWidth + 1 && panel.scrollTop === 0,
                    label + ': map panel has scrollable overflow');
                check(doc.scrollingElement.scrollHeight <= win.innerHeight + 1 &&
                    doc.scrollingElement.scrollWidth <= win.innerWidth + 1,
                    label + ': page has scrollable overflow');
                check(formBounds.bottom <= win.innerHeight &&
                    formBounds.right <= win.innerWidth && formBounds.left >= 0 &&
                    bounds.bottom <= formBounds.top,
                    label + ': unlock controls are clipped or overlap the map');
                check(Math.abs(formBounds.bottom - (panelBounds.bottom -
                    parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom))) <= 1,
                    label + ': map and controls do not fill the panel');
                check(mapBounds.left <= bounds.left + 1 && mapBounds.right >= bounds.right - 1 &&
                    mapBounds.top <= bounds.top + 1 && mapBounds.bottom >= bounds.bottom - 1,
                    label + ': map does not cover its viewport');
                check(Math.abs(surface.offsetWidth - surface.offsetHeight) <= 1,
                    label + ': map aspect ratio was distorted');
            };

            for (const [width, height] of [[390, 844], [360, 640], [844, 390], [1280, 900], [1280, 480]]) {
                frame.style.width = width + 'px';
                frame.style.height = height + 'px';
                await waitFor(() => doc.querySelectorAll('main').length === (width >= 900 ? 2 : 1),
                    'Responsive layout did not switch at ' + width);
                await settle();
                const label = width + 'x' + height;
                assertFits(label);
                const viewport = doc.querySelector('.map-viewport');
                const surface = doc.querySelector('.map-surface');
                const rect = viewport.getBoundingClientRect();
                const clientX = rect.left + rect.width / 2;
                const clientY = rect.top + rect.height / 2;
                const beforeScale = new win.DOMMatrix(surface.style.transform).a;
                const wheel = new win.WheelEvent('wheel', {
                    deltaY: -120, clientX, clientY, bubbles: true, cancelable: true,
                });
                viewport.dispatchEvent(wheel);
                await settle();
                check(wheel.defaultPrevented && Math.abs(
                    new win.DOMMatrix(surface.style.transform).a - beforeScale * Math.exp(0.6 / 3)
                ) < 0.001, label + ': wheel zoom did not run exactly once');
                const beforePan = surface.style.transform;
                surface.dispatchEvent(new win.PointerEvent('pointerdown', {
                    pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1,
                    clientX, clientY, bubbles: true,
                }));
                doc.dispatchEvent(new win.PointerEvent('pointermove', {
                    pointerId: 1, pointerType: 'mouse', buttons: 1,
                    clientX: clientX - 30, clientY: clientY - 20, bubbles: true,
                }));
                doc.dispatchEvent(new win.PointerEvent('pointerup', {
                    pointerId: 1, pointerType: 'mouse', bubbles: true,
                }));
                await settle();
                check(surface.style.transform !== beforePan, label + ': dragging did not pan the map');
                assertFits(label + ' after interaction');
            }
            UISettingsManager.setRegion('commonwealth');
            await waitFor(() => doc.querySelector('.map-surface')?.style.backgroundImage.includes('Commonwealth.webp'),
                'Actual cross-window storage changes did not update the mounted map');
            await settle();
            assertFits('Region changed from another window');
            const settings = doc.querySelector('nav .tab-button.mini');
            settings.click();
            await waitFor(() => doc.querySelector('#region-select'), 'Settings tab did not open');
            const panel = doc.querySelector('.l-desktop-right-panel main');
            check(!panel.classList.contains('map-panel') &&
                win.getComputedStyle(panel).overflowY === 'auto' &&
                panel.scrollHeight > panel.clientHeight,
                'Non-map tabs lost normal panel scrolling');
            panel.scrollTop = 50;
            check(panel.scrollTop > 0, 'Settings content is no longer scrollable');
            for (const [width, height] of [[320, 640], [360, 640], [390, 844], [844, 390], [900, 600], [1280, 900]]) {
                frame.style.width = width + 'px';
                frame.style.height = height + 'px';
                await waitFor(() => doc.querySelectorAll('main').length === (width >= 900 ? 2 : 1),
                    'Settings layout did not switch at ' + width);
                await settle();
                for (const language of ['en', 'it']) {
                    const languageSelect = doc.querySelector('#language-select');
                    languageSelect.value = language;
                    languageSelect.dispatchEvent(new win.Event('change', { bubbles: true }));
                    await pause();
                    await settle();
                    const regionSelect = doc.querySelector('#region-select');
                    regionSelect.value = 'capitalWasteland';
                    regionSelect.dispatchEvent(new win.Event('change', { bubbles: true }));
                    await pause();
                    const preferences = regionSelect.parentElement.parentElement;
                    const bounds = preferences.getBoundingClientRect();
                    for (const selector of preferences.querySelectorAll('select')) {
                        const field = selector.getBoundingClientRect();
                        check(field.left >= bounds.left - 1 && field.right <= bounds.right + 1,
                            width + ' ' + language + ': preference selector overflows its row');
                    }
                    if (width <= 390) {
                        check(regionSelect.getBoundingClientRect().top >
                            doc.querySelector('#language-select').getBoundingClientRect().top,
                            width + ' ' + language + ': region selector did not wrap');
                    }
                }
            }
            tab('MAP').click();
            await waitFor(() => doc.querySelector('.map-surface'), 'Map did not reopen');
            await settle();
            assertFits('Map reopened after a scrolling tab');
            check(win.mapLayoutErrors.length === 0, 'Map layout runtime errors: ' + JSON.stringify(win.mapLayoutErrors));
        } finally {
            frame.remove();
        }
    },
    async () => {
        await reset({}, 'empty');
        const meta = document.querySelector('meta[name="theme-color"]');
        check(meta, 'Missing theme-color metadata');
        const originalTheme = UISettingsManager.getCurrentTheme();
        document.body.classList.add('theme-regression-sentinel');
        try {
            for (const theme of Object.keys(THEMES)) {
                UISettingsManager.setTheme(theme);
                const style = getComputedStyle(document.body);
                const primaryColor = style.getPropertyValue('--primary-color');
                check(primaryColor.trim().length > 0 && meta.content === primaryColor,
                    theme + ': theme metadata does not match the primary color: ' + meta.content);
                check(document.body.classList.contains('theme-regression-sentinel'),
                    'Changing theme removed unrelated body classes');
                check(UISettingsManager.getCurrentTheme() === theme, 'Theme was not persisted');
            }
            UISettingsManager.setTheme('theme-fallout-new-vegas');
            Object.keys(THEMES).forEach(theme => document.body.classList.remove(theme));
            meta.content = '#afff03';
            UISettingsManager.applyAll();
            check(document.body.classList.contains('theme-fallout-new-vegas') &&
                meta.content === getComputedStyle(document.body).getPropertyValue('--primary-color'),
                'Startup did not restore the saved theme and matching primary color');
        } finally {
            UISettingsManager.setTheme(originalTheme);
            document.body.classList.remove('theme-regression-sentinel');
        }
    },
];
const results = [];
for (const run of cases) {
    try {
        await run();
        results.push(null);
    } catch (error) {
        results.push(error.stack ?? String(error));
    }
}
await fetch('/__ui_regressions__/results', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results, runtimeErrors }),
});
`;

test(
    'Browser interaction regressions',
    { skip: !chrome && 'Chrome/Chromium not found; set CHROME_PATH' },
    async t => {
        const profile = await mkdtemp(join(tmpdir(), 'pb3k-ui-test-'));
        let vite, browser, timer;
        const requests = [];
        try {
            let resolveResult, rejectResult;
            const completed = new Promise((resolve, reject) => {
                resolveResult = resolve;
                rejectResult = reject;
            });
            const handleFixtureRequest = (req, res, next) => {
                requests.push(req.url);
                if (req.url === '/__ui_regressions__/results' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk;
                    });
                    req.on('end', () => {
                        try {
                            const result = JSON.parse(body);
                            res.end('ok');
                            resolveResult(result);
                        } catch (error) {
                            res.writeHead(400).end();
                            rejectResult(error);
                        }
                    });
                } else if (req.url === '/' || req.url === '/__ui_regressions__/map-layout') {
                    res.setHeader('Content-Type', 'text/html');
                    res.end(`<!doctype html><html><head><meta name="theme-color" content="#afff03"></head><body><div id="root"></div>
                    <script>
                        const report = message => fetch('/__ui_regressions__/results', {
                            method: 'POST', body: JSON.stringify({results: [], runtimeErrors: [message]}),
                        });
                        window.addEventListener('error', event => report(
                            event.error?.stack ?? event.message ?? ('Module load failed: ' + event.target?.src)
                        ), {once: true, capture: true});
                        window.addEventListener('unhandledrejection', event => report(String(event.reason)), {once: true});
                    </script>
                    <script type="module" src="${req.url === '/' ? entryPath : mapLayoutPath}"></script></body></html>`);
                } else {
                    next();
                }
            };
            vite = await createServer({
                root,
                configFile: false,
                cacheDir: join(profile, 'vite-cache'),
                logLevel: 'warn',
                resolve: { alias: { '@': join(root, 'src') } },
                server: { host: '127.0.0.1', watch: null },
                optimizeDeps: {
                    entries: [],
                    noDiscovery: true,
                    include: [
                        'react',
                        'react/jsx-dev-runtime',
                        'react-dom',
                        'react-dom/client',
                        'i18next',
                        'react-i18next',
                        'zustand',
                        'zustand/middleware',
                        'fitty',
                        'zod',
                        '@iconify/react',
                    ],
                },
                esbuild: { jsx: 'automatic' },
                define: { __APP_VERSION__: JSON.stringify('ui-test') },
                plugins: [
                    {
                        name: 'ui-regression-fixture',
                        configureServer(server) {
                            server.middlewares.use(handleFixtureRequest);
                        },
                        resolveId(id) {
                            if (id === entryPath) return entryId;
                            if (id === mapLayoutPath) return mapLayoutId;
                        },
                        load(id) {
                            if (id === entryId) return fixture;
                            if (id === mapLayoutId) return mapLayoutFixture;
                        },
                    },
                ],
            });
            await vite.listen();
            const url = `http://127.0.0.1:${vite.httpServer.address().port}/`;
            assert.equal((await fetch(url)).status, 200);
            let stderr = '';
            browser = spawn(
                chrome,
                [
                    '--headless=new',
                    '--remote-debugging-port=0',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-background-networking',
                    '--disable-sync',
                    '--disable-component-update',
                    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
                    `--user-data-dir=${profile}`,
                    url,
                ],
                { stdio: ['ignore', 'ignore', 'pipe'] },
            );
            browser.stderr.on('data', chunk => {
                stderr = (stderr + chunk).slice(-6000);
            });
            browser.once('error', rejectResult);
            browser.once('exit', code =>
                rejectResult(new Error(`Chrome exited (${code}): ${stderr}`)),
            );
            timer = setTimeout(
                () =>
                    rejectResult(
                        new Error(
                            `Browser tests timed out; requests: ${requests.join(', ')}; ${stderr}`,
                        ),
                    ),
                45_000,
            );
            const { results, runtimeErrors } = await completed;
            assert.deepEqual(runtimeErrors, [], 'Unhandled browser errors');
            assert.equal(results.length, caseNames.length);
            for (const [index, name] of caseNames.entries()) {
                await t.test(name, () => assert.equal(results[index], null, results[index]));
            }
        } finally {
            clearTimeout(timer);
            if (browser?.pid && browser.exitCode === null && browser.signalCode === null) {
                await new Promise(resolve => {
                    browser.once('exit', resolve);
                    browser.kill();
                });
            }
            await vite?.close();
            await rm(profile, { recursive: true, force: true });
        }
    },
);
