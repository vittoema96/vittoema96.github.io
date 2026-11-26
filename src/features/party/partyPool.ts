// Party helpers shared by the group code: codes, PA limits and the local PA counter.

export type PartyPool = {
    groupAP: number;
    overseerAP: number;
};

export type PartyPoolKey = keyof PartyPool;

export const INITIAL_PARTY_POOL: PartyPool = { groupAP: 0, overseerAP: 0 };

export const MAX_PARTY_AP = 6;
export const MAX_PLAYER_NAME_LENGTH = 24;
export const MAX_PLAYER_LEVEL = 99;
export const MAX_ORIGIN_LENGTH = 40;

// Codes are 12 characters from a 31-symbol alphabet (~59 bits), grouped as xxxx-xxxx-xxxx.
// Random codes this long make accidental collisions between parties practically impossible.
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODE_LENGTH = 12;

/** Strips separators and case, then re-groups as xxxx-xxxx-xxxx. */
export function formatPartyCode(raw: string): string {
    const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return compact.match(/.{1,4}/g)?.join('-') ?? '';
}

export function isValidPartyCode(raw: string): boolean {
    const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return compact.length === CODE_LENGTH && [...compact].every(c => CODE_ALPHABET.includes(c));
}

/** Generates a fresh random party code using the Web Crypto API (rejection sampling avoids modulo bias). */
export function generatePartyCode(
    random: (n: number) => Uint8Array = n => crypto.getRandomValues(new Uint8Array(n)),
): string {
    const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
    let out = '';
    while (out.length < CODE_LENGTH) {
        for (const byte of random(CODE_LENGTH)) {
            if (byte < limit && out.length < CODE_LENGTH) {
                out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
            }
        }
    }
    return formatPartyCode(out);
}

/** Applies a delta to one pool counter, keeping it within 0..MAX_PARTY_AP. */
export function adjustPool(pool: PartyPool, key: PartyPoolKey, delta: number): PartyPool {
    const next = Math.max(0, Math.min(MAX_PARTY_AP, pool[key] + delta));
    return next === pool[key] ? pool : { ...pool, [key]: next };
}
