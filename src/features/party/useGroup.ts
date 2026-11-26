import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    clampGroupAP,
    deriveGroupSecret,
    HEARTBEAT_MS,
    isOnline,
    MAX_PUBLISH_ATTEMPTS,
    MIN_RELAY_ACCEPTS,
    nextStamp,
    publishRetryDelayMs,
    sumContributions,
    type GroupLocal,
    type GroupMemberPayload,
} from '@/features/party/groupSync.ts';
import { MAX_PARTY_AP } from '@/features/party/partyPool.ts';
import {
    anyRelayConnected,
    fetchMembers,
    publishMember,
    subscribeMembers,
} from '@/features/party/groupRelay.ts';
import { dequeueLeave, enqueueLeave, flushPendingLeaves } from '@/features/party/groupLeaves.ts';

export type GroupSyncStatus = 'synced' | 'pending' | 'offline';

export type SelfInfo = {
    memberId: string;
    name: string;
    origin: string;
    level: number;
};

export type RosterMember = SelfInfo & {
    self: boolean;
    /** Heartbeat seen recently (or this device). */
    online: boolean;
    /** Last heartbeat time from the relays, null if never seen. */
    lastSeen: number | null;
};

export type GroupState = {
    members: RosterMember[];
    /** Group PA: sum of everyone's contributions, clamped to 0..MAX. */
    playerAP: number;
    status: GroupSyncStatus;
    adjust: (delta: number) => void;
    leave: () => void;
};

type Options = {
    code: string | null;
    self: SelfInfo;
    local: GroupLocal | null;
    saveLocal: (next: GroupLocal) => void;
};

/** Keeps, per member, the newest entry. */
function mergeEntries(
    current: Map<string, GroupMemberPayload>,
    incoming: Map<string, GroupMemberPayload>,
): Map<string, GroupMemberPayload> {
    const next = new Map(current);
    for (const [memberId, payload] of incoming) {
        if ((next.get(memberId)?.updatedAt ?? -1) < payload.updatedAt) {
            next.set(memberId, payload);
        }
    }
    return next;
}

/**
 * Everything about the group a character sees: the roster (who is in it, online or not),
 * the group PA, and the sync status. Each character writes only its own entry; the group PA
 * is the sum of the entries, so a stale device can never overwrite another player's value.
 */
export function useGroup({ code, self, local, saveLocal }: Options): GroupState {
    const [stored, setStored] = useState<Map<string, GroupMemberPayload>>(() => new Map());
    const [myPA, setMyPA] = useState(0);
    const [status, setStatus] = useState<GroupSyncStatus>('offline');
    const [now, setNow] = useState(() => Date.now());

    const codeRef = useRef(code);
    const selfRef = useRef(self);
    const saveRef = useRef(saveLocal);
    const localRef = useRef<GroupLocal | null>(null);
    const othersRef = useRef(0);
    const secretRef = useRef<Uint8Array | null>(null);
    const stampRef = useRef(0);
    const attemptRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const publishRef = useRef<() => Promise<void>>(async () => {});

    const others = useMemo(() => sumContributions(stored, self.memberId), [stored, self.memberId]);

    useEffect(() => {
        codeRef.current = code;
        selfRef.current = self;
        saveRef.current = saveLocal;
        othersRef.current = others;
    });

    const writeLocal = useCallback((next: GroupLocal) => {
        localRef.current = next;
        setMyPA(next.myPA);
        saveRef.current(next);
    }, []);

    const schedule = useCallback((delayMs: number) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => void publishRef.current(), delayMs);
    }, []);

    /** Writes this character's entry (contribution, details and heartbeat). Retries with backoff. */
    const publish = useCallback(async () => {
        const currentCode = codeRef.current;
        const secret = secretRef.current;
        const current = localRef.current;
        const me = selfRef.current;
        if (!currentCode || !secret || !current || !me.memberId) {
            return;
        }
        const payload: GroupMemberPayload = {
            name: me.name,
            origin: me.origin,
            level: me.level,
            pa: current.myPA,
            seenAt: Date.now(),
            updatedAt: nextStamp(stampRef.current),
            left: false,
        };
        stampRef.current = payload.updatedAt;
        const accepted = await publishMember(secret, me.memberId, payload);
        if (codeRef.current !== currentCode) {
            return; // left or switched group while publishing
        }

        const latest = localRef.current;
        if (accepted >= MIN_RELAY_ACCEPTS) {
            attemptRef.current = 0;
            if (latest && latest.pending && latest.myPA === payload.pa) {
                writeLocal({ ...latest, pending: false });
            }
            // Read the state after the write above, so a confirmed value reports "synced".
            setStatus(localRef.current?.pending ? 'pending' : 'synced');
            return;
        }

        setStatus(anyRelayConnected() ? 'pending' : 'offline');
        if (attemptRef.current < MAX_PUBLISH_ATTEMPTS) {
            schedule(publishRetryDelayMs(attemptRef.current++));
        }
    }, [schedule, writeLocal]);

    useEffect(() => {
        publishRef.current = publish;
    }, [publish]);

    const requestPublish = useCallback(
        (delayMs: number) => {
            attemptRef.current = 0;
            schedule(delayMs);
        },
        [schedule],
    );

    // Join / leave: load this character's local copy for the code, then read and publish.
    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        attemptRef.current = 0;
        setStored(new Map());
        if (!code) {
            localRef.current = null;
            secretRef.current = null;
            setMyPA(0);
            setStatus('offline');
            return;
        }

        const initial: GroupLocal =
            local && local.code === code ? { ...local } : { code, myPA: 0, pending: false };
        localRef.current = initial;
        setMyPA(initial.myPA);
        if (initial !== local) {
            saveRef.current(initial);
        }
        setStatus(initial.pending ? 'pending' : 'offline');

        let cancelled = false;
        let closeSubscription: (() => void) | null = null;

        const readRelays = async (secret: Uint8Array) => {
            const remote = await fetchMembers(secret);
            if (!cancelled) {
                setStored(prev => mergeEntries(prev, remote));
                setNow(Date.now());
            }
        };

        void (async () => {
            const secret = await deriveGroupSecret(code);
            if (cancelled) {
                return;
            }
            secretRef.current = secret;
            await readRelays(secret);
            if (cancelled) {
                return;
            }
            closeSubscription = subscribeMembers(secret, (memberId, payload) =>
                setStored(prev => mergeEntries(prev, new Map([[memberId, payload]]))),
            );
            requestPublish(0); // announce this character (also records the join)
        })();

        const refresh = () => {
            if (secretRef.current && document.visibilityState !== 'hidden') {
                void readRelays(secretRef.current);
                requestPublish(0);
                void flushPendingLeaves();
            }
        };
        const heartbeat = setInterval(refresh, HEARTBEAT_MS);
        document.addEventListener('visibilitychange', refresh);
        window.addEventListener('online', refresh);

        return () => {
            cancelled = true;
            closeSubscription?.();
            clearInterval(heartbeat);
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener('online', refresh);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            secretRef.current = null;
        };
        // `local` is read only when the code changes; later changes are kept in localRef.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, requestPublish]);

    // Publish whenever this character's details change.
    useEffect(() => {
        if (code && self.memberId) {
            requestPublish(0);
        }
    }, [code, self.memberId, self.name, self.origin, self.level, requestPublish]);

    const adjust = useCallback(
        (delta: number) => {
            const current = localRef.current;
            if (!codeRef.current || !current) {
                return;
            }
            const shown = clampGroupAP(othersRef.current + current.myPA);
            if ((delta > 0 && shown >= MAX_PARTY_AP) || (delta < 0 && shown <= 0)) {
                return;
            }
            writeLocal({ ...current, myPA: current.myPA + delta, pending: true });
            setStatus('pending');
            requestPublish(300); // debounce rapid taps into one write
        },
        [requestPublish, writeLocal],
    );

    const leave = useCallback(() => {
        const currentCode = codeRef.current;
        const me = selfRef.current;
        const current = localRef.current;
        const secret = secretRef.current;
        if (!currentCode || !me.memberId) {
            return;
        }
        // Stop any pending publish from this character before the code is cleared.
        codeRef.current = null;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        const payload: GroupMemberPayload = {
            name: me.name,
            origin: me.origin,
            level: me.level,
            pa: current?.myPA ?? 0,
            seenAt: Date.now(),
            updatedAt: nextStamp(stampRef.current),
            left: true,
        };
        stampRef.current = payload.updatedAt;
        void (async () => {
            const key = secret ?? (await deriveGroupSecret(currentCode));
            const accepted = await publishMember(key, me.memberId, payload);
            if (accepted < 1) {
                enqueueLeave({ code: currentCode, memberId: me.memberId, payload });
            } else {
                dequeueLeave(currentCode, me.memberId);
            }
        })();
    }, []);

    // Clock for the online/offline state. Refreshed by the heartbeat and by stored updates.
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), HEARTBEAT_MS / 2);
        return () => clearInterval(timer);
    }, []);

    const members = useMemo(() => {
        const ids = new Set([...stored.keys(), self.memberId]);
        const list: RosterMember[] = [];
        for (const memberId of ids) {
            if (!memberId) {
                continue;
            }
            const isSelf = memberId === self.memberId;
            const entry = stored.get(memberId);
            if (!isSelf && (!entry || entry.left)) {
                continue; // left the group
            }
            const source = isSelf ? self : entry!;
            list.push({
                memberId,
                name: source.name,
                origin: source.origin,
                level: source.level,
                self: isSelf,
                online: isSelf || isOnline(entry, now),
                lastSeen: entry?.seenAt ?? null,
            });
        }
        return list.sort(
            (a, b) =>
                Number(b.self) - Number(a.self) ||
                Number(b.online) - Number(a.online) ||
                a.name.localeCompare(b.name),
        );
    }, [stored, self, now]);

    return {
        members,
        playerAP: clampGroupAP(others + myPA),
        status,
        adjust,
        leave,
    };
}
