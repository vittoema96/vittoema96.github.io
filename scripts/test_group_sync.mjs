import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
let server, sync;

before(async () => {
    server = await createServer({
        configFile: false,
        root,
        resolve: { alias: { '@': `${root}src` } },
        server: { middlewareMode: true, hmr: false, ws: false, watch: null },
        optimizeDeps: { noDiscovery: true, entries: [] },
        esbuild: { jsx: 'automatic' },
    });
    sync = await server.ssrLoadModule('/src/features/party/groupSync.ts');
});

after(async () => {
    await server?.close();
});

const member = (pa, extra = {}) => ({
    name: 'A',
    origin: 'vaultDweller',
    level: 3,
    pa,
    seenAt: 1_000_000,
    updatedAt: 1_000_000,
    left: false,
    ...extra,
});

test('the group secret is deterministic and depends only on the normalised code', async () => {
    const a = await sync.deriveGroupSecret('ABCD-efgh-jklm');
    const b = await sync.deriveGroupSecret('abcdefghjklm');
    const c = await sync.deriveGroupSecret('abcd-efgh-jkln');
    assert.equal(a.length, 32);
    assert.deepEqual(a, b);
    assert.notDeepEqual(a, c);
});

test('member ids are 12 lowercase alphanumerics and differ between characters', () => {
    const a = sync.newMemberId();
    const b = sync.newMemberId();
    assert.match(a, /^[a-z0-9]{12}$/);
    assert.notEqual(a, b);
});

test('member payloads round-trip through serialisation', () => {
    const payload = member(-2, { left: true });
    assert.deepEqual(sync.parseMemberPayload(sync.serializeMemberPayload(payload)), payload);
});

test('malformed member payloads are rejected', () => {
    const valid = JSON.parse(sync.serializeMemberPayload(member(1)));
    const bad = [
        '',
        'not json',
        'null',
        JSON.stringify({ ...valid, pa: 1000 }),
        JSON.stringify({ ...valid, pa: 1.5 }),
        JSON.stringify({ ...valid, pa: '2' }),
        JSON.stringify({ ...valid, level: 100 }),
        JSON.stringify({ ...valid, level: -1 }),
        JSON.stringify({ ...valid, seenAt: undefined }),
        JSON.stringify({ ...valid, updatedAt: -5 }),
        JSON.stringify({ ...valid, name: 42 }),
    ];
    for (const text of bad) {
        assert.equal(sync.parseMemberPayload(text), null, text);
    }
});

test('names and origins are trimmed and capped', () => {
    const text = JSON.stringify({
        ...JSON.parse(sync.serializeMemberPayload(member(0))),
        name: ' ' + 'x'.repeat(80),
    });
    assert.equal(sync.parseMemberPayload(text).name.length, 24);
});

test('the group PA is the sum of contributions, and a player does not count their own stale copy', () => {
    const members = new Map([
        ['me', member(2)],
        ['ann', member(3)],
        ['bob', member(-1, { left: true })],
    ]);
    assert.equal(sync.sumContributions(members), 4, 'left members keep their contribution');
    assert.equal(sync.sumContributions(members, 'me'), 2, 'own entry is excluded from "others"');
});

test('group values are clamped to 0..6', () => {
    assert.equal(sync.clampGroupAP(-3), 0);
    assert.equal(sync.clampGroupAP(4), 4);
    assert.equal(sync.clampGroupAP(9), 6);
});

test('a member is online only with a recent, non-left heartbeat', () => {
    const now = 10_000_000;
    assert.equal(sync.isOnline(member(0, { seenAt: now - 1000 }), now), true);
    assert.equal(sync.isOnline(member(0, { seenAt: now - sync.ONLINE_WINDOW_MS - 1 }), now), false);
    assert.equal(sync.isOnline(member(0, { seenAt: now, left: true }), now), false);
    assert.equal(sync.isOnline(undefined, now), false);
});

test('version stamps strictly increase even when the clock does not move', () => {
    const first = sync.nextStamp(0, 5000);
    const second = sync.nextStamp(first, 5000);
    const third = sync.nextStamp(second, 1000); // clock went backwards
    assert.equal(first, 5000);
    assert.equal(second, 5001);
    assert.equal(third, 5002);
});

test('publish retries grow exponentially and are capped', () => {
    assert.equal(sync.publishRetryDelayMs(0), 1000);
    assert.equal(sync.publishRetryDelayMs(3), 8000);
    assert.equal(sync.publishRetryDelayMs(50), 60000);
});
