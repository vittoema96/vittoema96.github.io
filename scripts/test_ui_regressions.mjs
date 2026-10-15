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
    'New companion edits preserve defaults, name, HP and consecutive SPECIAL changes',
];

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
import { createDefaultCompanion } from '/src/utils/companionTypes.ts';
import CompanionTab from '/src/app/tabs/companion/CompanionTab.tsx';
import D6Popup from '/src/app/components/popup/dice/D6Popup.tsx';
import ModifyItemPopup from '/src/app/components/popup/ModifyItemPopup.tsx';
import { useItemManagement } from '/src/app/contexts/useItemManagement.ts';
import { useInventoryActions } from '/src/app/tabs/inv/hooks/useInventoryActions.ts';

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
    </PopupProvider></TooltipProvider></CharacterProvider></React.StrictMode>);
}
async function reset(raw, view, props) {
    app.render(null);
    await pause();
    alerts = [];
    closed = 0;
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
                } else if (req.url === '/') {
                    res.setHeader('Content-Type', 'text/html');
                    res.end(`<!doctype html><html><body><div id="root"></div>
                    <script>
                        const report = message => fetch('/__ui_regressions__/results', {
                            method: 'POST', body: JSON.stringify({results: [], runtimeErrors: [message]}),
                        });
                        window.addEventListener('error', event => report(
                            event.error?.stack ?? event.message ?? ('Module load failed: ' + event.target?.src)
                        ), {once: true, capture: true});
                        window.addEventListener('unhandledrejection', event => report(String(event.reason)), {once: true});
                    </script>
                    <script type="module" src="${entryPath}"></script></body></html>`);
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
                        },
                        load(id) {
                            if (id === entryId) return fixture;
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
