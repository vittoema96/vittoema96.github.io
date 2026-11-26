// Leaves that could not be published (device offline). Kept on this device and retried later,
// so a member doesn't stay in the group list forever.
import { deriveGroupSecret, type GroupMemberPayload } from '@/features/party/groupSync.ts';
import { publishMember } from '@/features/party/groupRelay.ts';

const STORAGE_KEY = 'PB3K_party_pending_leaves';

export type QueuedLeave = {
    code: string;
    memberId: string;
    payload: GroupMemberPayload;
};

function readQueue(): QueuedLeave[] {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        return Array.isArray(parsed) ? (parsed as QueuedLeave[]) : [];
    } catch {
        return [];
    }
}

function writeQueue(queue: QueuedLeave[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
        // Storage can be unavailable (private mode); the leave is then best-effort only.
    }
}

export function enqueueLeave(leave: QueuedLeave): void {
    writeQueue([
        ...readQueue().filter(
            item => !(item.code === leave.code && item.memberId === leave.memberId),
        ),
        leave,
    ]);
}

/** Drops a queued leave, e.g. when the character joins that group again. */
export function dequeueLeave(code: string, memberId: string): void {
    writeQueue(readQueue().filter(item => !(item.code === code && item.memberId === memberId)));
}

/** Retries every queued leave. Each one is removed once a relay accepts it. */
export async function flushPendingLeaves(): Promise<void> {
    for (const item of readQueue()) {
        const secret = await deriveGroupSecret(item.code);
        const accepted = await publishMember(secret, item.memberId, item.payload);
        if (accepted >= 1) {
            dequeueLeave(item.code, item.memberId);
        }
    }
}

/**
 * Marks a character as left, using its stored slot data (used when a character is deleted).
 * If the relays can't be reached now, the leave is queued like any other.
 */
export async function announceLeaveFromSlot(slot: {
    partyCode?: string | null | undefined;
    memberId?: string | undefined;
    name?: string | undefined;
    origin?: string | undefined;
    level?: number | undefined;
    groupPA?: { myPA: number } | null | undefined;
}): Promise<void> {
    if (!slot.partyCode || !slot.memberId) {
        return;
    }
    const payload: GroupMemberPayload = {
        name: slot.name ?? '',
        origin: slot.origin ?? '',
        level: slot.level ?? 1,
        pa: slot.groupPA?.myPA ?? 0,
        seenAt: Date.now(),
        updatedAt: Date.now(),
        left: true,
    };
    const secret = await deriveGroupSecret(slot.partyCode);
    const accepted = await publishMember(secret, slot.memberId, payload);
    if (accepted < 1) {
        enqueueLeave({ code: slot.partyCode, memberId: slot.memberId, payload });
    }
}
