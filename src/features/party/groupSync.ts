// Group sync rules (pure logic, no network, so they can be unit-tested).
//
// Model: every character in a group publishes ONE replaceable Nostr event (NIP-78, kind 30078)
// containing its own details, its own PA contribution and a heartbeat. Only that character's
// device writes that event, so no device can overwrite another's data.
// The group PA is the sum of all member contributions, clamped to 0..MAX_PARTY_AP.

import {
    formatPartyCode,
    MAX_ORIGIN_LENGTH,
    MAX_PARTY_AP,
    MAX_PLAYER_LEVEL,
    MAX_PLAYER_NAME_LENGTH,
} from '@/features/party/partyPool.ts';

export const GROUP_EVENT_KIND = 30078;
export const MEMBER_TAG = 'pb3k-member';
export const GROUP_RELAYS = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.primal.net',
    'wss://relay.snort.social',
];

/** How often an open app refreshes its heartbeat and re-reads the group. */
export const HEARTBEAT_MS = 60_000;
/** A member counts as online if its heartbeat is newer than this (two missed heartbeats). */
export const ONLINE_WINDOW_MS = 2.5 * HEARTBEAT_MS;
/** Publishing gives up for now after this many failed attempts; the next trigger resets it. */
export const MAX_PUBLISH_ATTEMPTS = 8;
/** Relays must accept a write from at least this many relays to count as synced. */
export const MIN_RELAY_ACCEPTS = 2;

const PUBLISH_BASE_MS = 1000;
const PUBLISH_MAX_MS = 60_000;
const PA_LIMIT = 999;

/** Content of one member's event. `pa` is this character's own contribution (can be negative). */
export type GroupMemberPayload = {
    name: string;
    origin: string;
    level: number;
    pa: number;
    /** Heartbeat time (ms). Used for the online/offline state. */
    seenAt: number;
    /** Version time (ms). Strictly increasing per member. */
    updatedAt: number;
    /** True when the character left the group. */
    left: boolean;
};

/** Local copy kept on the character. `myPA` is this character's contribution to the group. */
export type GroupLocal = {
    code: string;
    myPA: number;
    /** True while the latest value has not been accepted by enough relays. */
    pending: boolean;
};

/** Derives the Nostr secret key from the party code, so players share only the code. */
export async function deriveGroupSecret(code: string): Promise<Uint8Array> {
    const data = new TextEncoder().encode(`pb3k-party-v1:${formatPartyCode(code)}`);
    return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

export function memberDTag(memberId: string): string {
    return `${MEMBER_TAG}:${memberId}`;
}

/** Stable random id for a character, generated once when it joins a group. */
export function newMemberId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    return Array.from(bytes, b => (b % 36).toString(36)).join('');
}

export function serializeMemberPayload(payload: GroupMemberPayload): string {
    return JSON.stringify({ v: 2, ...payload });
}

/** Validates an event's content. Anything malformed is rejected, never partly used. */
export function parseMemberPayload(content: string): GroupMemberPayload | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch {
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null) {
        return null;
    }
    const v = parsed as Record<string, unknown>;
    const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
    if (
        typeof v['name'] !== 'string' ||
        typeof v['origin'] !== 'string' ||
        !isNumber(v['level']) ||
        !Number.isInteger(v['level']) ||
        v['level'] < 0 ||
        v['level'] > MAX_PLAYER_LEVEL ||
        !isNumber(v['pa']) ||
        !Number.isInteger(v['pa']) ||
        Math.abs(v['pa']) > PA_LIMIT ||
        !isNumber(v['seenAt']) ||
        v['seenAt'] < 0 ||
        !isNumber(v['updatedAt']) ||
        v['updatedAt'] < 0
    ) {
        return null;
    }
    return {
        name: v['name'].trim().slice(0, MAX_PLAYER_NAME_LENGTH),
        origin: v['origin'].slice(0, MAX_ORIGIN_LENGTH),
        level: v['level'],
        pa: v['pa'],
        seenAt: v['seenAt'],
        updatedAt: v['updatedAt'],
        left: v['left'] === true,
    };
}

/** Sum of contributions, optionally skipping one member (usually yourself). Left members still count. */
export function sumContributions(
    members: Iterable<[string, GroupMemberPayload]>,
    excludeMemberId?: string,
): number {
    let total = 0;
    for (const [memberId, payload] of members) {
        if (memberId !== excludeMemberId) {
            total += payload.pa;
        }
    }
    return total;
}

/** Clamps a group value to the allowed range. */
export function clampGroupAP(value: number): number {
    return Math.max(0, Math.min(MAX_PARTY_AP, value));
}

export function isOnline(entry: GroupMemberPayload | undefined, now: number): boolean {
    return Boolean(entry && !entry.left && now - entry.seenAt < ONLINE_WINDOW_MS);
}

/** Next version stamp: the current time, but always larger than the previous one from this device. */
export function nextStamp(previous: number, now: number = Date.now()): number {
    return Math.max(now, previous + 1);
}

/** Exponential backoff for publishing, capped. */
export function publishRetryDelayMs(attempt: number): number {
    return Math.min(PUBLISH_MAX_MS, PUBLISH_BASE_MS * 2 ** Math.min(attempt, 16));
}
