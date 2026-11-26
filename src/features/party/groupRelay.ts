// Network side of group sync: writes, reads and live subscriptions on public Nostr relays.
import { SimplePool, finalizeEvent, getPublicKey, verifyEvent, type Event } from 'nostr-tools';
import {
    GROUP_EVENT_KIND,
    GROUP_RELAYS,
    MEMBER_TAG,
    memberDTag,
    parseMemberPayload,
    serializeMemberPayload,
    type GroupMemberPayload,
} from '@/features/party/groupSync.ts';

const READ_TIMEOUT_MS = 4000;
const WRITE_TIMEOUT_MS = 5000;

let pool: SimplePool | null = null;
const getPool = () => (pool ??= new SimplePool());

/** True when at least one relay currently has an open connection. */
export function anyRelayConnected(): boolean {
    return [...getPool().listConnectionStatus().values()].some(Boolean);
}

function memberIdOf(event: Event): string | null {
    const d = event.tags.find(tag => tag[0] === 'd')?.[1];
    return d?.startsWith(`${MEMBER_TAG}:`) ? d.slice(MEMBER_TAG.length + 1) : null;
}

/** Returns the member and payload for a valid event, or null. */
function parseMemberEvent(event: Event | null | undefined) {
    if (!event || !verifyEvent(event)) {
        return null;
    }
    const memberId = memberIdOf(event);
    const payload = parseMemberPayload(event.content);
    return memberId && payload ? { memberId, payload } : null;
}

/**
 * Writes one member's entry. Resolves to the number of relays that accepted it.
 * Callers treat fewer than MIN_RELAY_ACCEPTS as "not safely stored yet".
 */
export async function publishMember(
    secret: Uint8Array,
    memberId: string,
    payload: GroupMemberPayload,
): Promise<number> {
    const event = finalizeEvent(
        {
            kind: GROUP_EVENT_KIND,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ['d', memberDTag(memberId)],
                ['t', MEMBER_TAG],
            ],
            content: serializeMemberPayload(payload),
        },
        secret,
    );
    const results = await Promise.allSettled(
        getPool().publish(GROUP_RELAYS, event, { maxWait: WRITE_TIMEOUT_MS }),
    );
    return results.filter(result => result.status === 'fulfilled').length;
}

/**
 * Latest entry of every member, read from ALL relays together. For each member the entry with
 * the newest `updatedAt` wins, so a relay that is behind cannot hide newer data.
 */
export async function fetchMembers(secret: Uint8Array): Promise<Map<string, GroupMemberPayload>> {
    const events = await getPool().querySync(
        GROUP_RELAYS,
        { kinds: [GROUP_EVENT_KIND], authors: [getPublicKey(secret)], '#t': [MEMBER_TAG] },
        { maxWait: READ_TIMEOUT_MS },
    );
    const members = new Map<string, GroupMemberPayload>();
    for (const event of events) {
        const parsed = parseMemberEvent(event);
        if (parsed && (members.get(parsed.memberId)?.updatedAt ?? -1) < parsed.payload.updatedAt) {
            members.set(parsed.memberId, parsed.payload);
        }
    }
    return members;
}

/** Calls `onMember` for every valid member entry the relays send, now or later. */
export function subscribeMembers(
    secret: Uint8Array,
    onMember: (memberId: string, payload: GroupMemberPayload) => void,
): () => void {
    const closer = getPool().subscribeMany(
        GROUP_RELAYS,
        { kinds: [GROUP_EVENT_KIND], authors: [getPublicKey(secret)], '#t': [MEMBER_TAG] },
        {
            onevent(event) {
                const parsed = parseMemberEvent(event);
                if (parsed) {
                    onMember(parsed.memberId, parsed.payload);
                }
            },
        },
    );
    return () => closer.close();
}
