import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useCharacter } from '@/app/contexts/CharacterContext';
import {
    adjustPool,
    formatPartyCode,
    generatePartyCode,
    INITIAL_PARTY_POOL,
    isValidPartyCode,
    type PartyPool,
} from '@/features/party/partyPool.ts';
import { newMemberId, type GroupLocal } from '@/features/party/groupSync.ts';
import { dequeueLeave, flushPendingLeaves } from '@/features/party/groupLeaves.ts';
import { useGroup, type GroupSyncStatus, type RosterMember } from '@/features/party/useGroup.ts';

type PartyContextValue = {
    code: string | null;
    /** True when the active character is connected to a group. */
    inParty: boolean;
    /** Sync state of the group PA (synced / pending / offline). */
    groupStatus: GroupSyncStatus;
    members: RosterMember[];
    pool: PartyPool;
    adjust: (key: 'groupAP', delta: number) => void;
    create: () => void;
    join: (rawCode: string) => boolean;
    leave: () => void;
};

const PartyContext = createContext<PartyContextValue | null>(null);

/**
 * Connects the active character to its group. The code and member id are saved on the character,
 * so each character can belong to a different group and reconnects automatically on reload.
 * Outside a group, PA are kept only on the character.
 */
export function PartyProvider({ children }: Readonly<{ children: ReactNode }>) {
    const { character, rawCharacter, updateCharacter } = useCharacter();
    const code = rawCharacter.partyCode ?? null;

    const self = {
        memberId: rawCharacter.memberId ?? '',
        name: character.name ?? '',
        origin: character.origin?.id ?? '',
        level: character.level,
    };

    const saveLocal = useCallback(
        (next: GroupLocal) => updateCharacter({ groupPA: next }),
        [updateCharacter],
    );
    const group = useGroup({
        code,
        self,
        local: rawCharacter.groupPA ?? null,
        saveLocal,
    });
    const { adjust: adjustGroup, leave: leaveGroup } = group;

    // Retry leaves that could not be sent earlier, when the app starts and comes back online.
    useEffect(() => {
        void flushPendingLeaves();
        const retry = () => void flushPendingLeaves();
        window.addEventListener('online', retry);
        return () => window.removeEventListener('online', retry);
    }, []);

    const joinGroup = useCallback(
        (next: string) => {
            const memberId = rawCharacter.memberId || newMemberId();
            dequeueLeave(next, memberId); // rejoining cancels an unsent leave for this group
            updateCharacter({
                partyCode: next,
                memberId,
                groupPA: { code: next, myPA: 0, pending: false },
            });
        },
        [rawCharacter.memberId, updateCharacter],
    );

    const create = useCallback(() => joinGroup(generatePartyCode()), [joinGroup]);

    const join = useCallback(
        (rawCode: string) => {
            if (!isValidPartyCode(rawCode)) {
                return false;
            }
            joinGroup(formatPartyCode(rawCode));
            return true;
        },
        [joinGroup],
    );

    const leave = useCallback(() => {
        leaveGroup();
        updateCharacter({ partyCode: null });
    }, [leaveGroup, updateCharacter]);

    const inParty = code !== null;
    const localGroupAP = rawCharacter.localGroupAP ?? 0;
    const shownGroupAP = inParty ? group.playerAP : localGroupAP;

    const adjust = useCallback(
        (_key: 'groupAP', delta: number) => {
            if (inParty) {
                adjustGroup(delta);
                return;
            }
            updateCharacter(prev => ({
                localGroupAP: adjustPool(
                    { groupAP: prev.localGroupAP ?? 0, overseerAP: INITIAL_PARTY_POOL.overseerAP },
                    'groupAP',
                    delta,
                ).groupAP,
            }));
        },
        [inParty, adjustGroup, updateCharacter],
    );

    const value = useMemo(
        () => ({
            code,
            inParty,
            groupStatus: group.status,
            members: group.members,
            pool: { groupAP: shownGroupAP, overseerAP: INITIAL_PARTY_POOL.overseerAP },
            adjust,
            create,
            join,
            leave,
        }),
        [code, inParty, group.status, group.members, shownGroupAP, adjust, create, join, leave],
    );

    return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

export function useParty(): PartyContextValue {
    const value = useContext(PartyContext);
    if (!value) {
        throw new Error('useParty must be used inside PartyProvider');
    }
    return value;
}
