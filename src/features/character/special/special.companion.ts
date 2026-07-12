export const COMPANION_SPECIAL = ['body', 'mind'] as const;
export type CompanionSpecialType = (typeof COMPANION_SPECIAL)[number];

export function isCompanionSpecial(special: any): special is CompanionSpecialType {
    return COMPANION_SPECIAL.includes(special);
}
