import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
let server, party;

before(async () => {
    server = await createServer({
        configFile: false,
        root,
        resolve: { alias: { '@': `${root}src` } },
        server: { middlewareMode: true, hmr: false, ws: false, watch: null },
        optimizeDeps: { noDiscovery: true, entries: [] },
        esbuild: { jsx: 'automatic' },
    });
    party = await server.ssrLoadModule('/src/features/party/partyPool.ts');
});

after(async () => {
    await server?.close();
});

test('generated codes are 12 characters grouped xxxx-xxxx-xxxx and validate', () => {
    for (let i = 0; i < 200; i++) {
        const code = party.generatePartyCode();
        assert.match(code, /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
        assert.equal(party.isValidPartyCode(code), true);
    }
});

test('generated codes do not repeat in practice', () => {
    const seen = new Set();
    for (let i = 0; i < 5000; i++) {
        seen.add(party.generatePartyCode());
    }
    assert.equal(seen.size, 5000);
});

test('rejection sampling never produces characters outside the alphabet', () => {
    // Bytes >= 248 must be discarded (248 = 31 * 8); feed a mix including them.
    let calls = 0;
    const code = party.generatePartyCode(n => {
        calls++;
        return calls === 1 ? new Uint8Array(n).fill(255) : new Uint8Array(n).fill(0);
    });
    assert.equal(code, 'aaaa-aaaa-aaaa');
    assert.ok(calls >= 2, 'high bytes were rejected and a second batch was drawn');
});

test('typed codes are normalised and validated', () => {
    assert.equal(party.formatPartyCode('K7QP29XMR4TZ'), 'k7qp-29xm-r4tz');
    assert.equal(party.formatPartyCode(' k7qp 29xm-r4tz '), 'k7qp-29xm-r4tz');
    assert.equal(party.isValidPartyCode('k7qp-29xm-r4tz'), true);
    assert.equal(party.isValidPartyCode('k7qp29xmr4t'), false, 'too short');
    assert.equal(party.isValidPartyCode('vault-111'), false, 'legacy short codes are rejected');
    assert.equal(party.isValidPartyCode('k7qp-29xm-r4tl'), false, 'letter l is not in the alphabet');
});

test('local pool adjustments clamp between 0 and the maximum', () => {
    const start = party.INITIAL_PARTY_POOL;
    assert.deepEqual(party.adjustPool(start, 'groupAP', -1), start, 'cannot go below zero');
    assert.equal(party.adjustPool(start, 'groupAP', 3).groupAP, 3);
    const max = { groupAP: party.MAX_PARTY_AP, overseerAP: 0 };
    assert.equal(party.adjustPool(max, 'groupAP', 5).groupAP, party.MAX_PARTY_AP);
    assert.equal(party.MAX_PARTY_AP, 6);
    assert.equal(party.adjustPool(start, 'overseerAP', 2).groupAP, 0, 'other pool untouched');
});
