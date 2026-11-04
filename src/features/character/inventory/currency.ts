import type { RawCharacter } from '@/types';

type Currencies = Pick<RawCharacter, 'caps' | 'ncrDollars' | 'legionDenarius' | 'prewarMoney'>;
export type CurrencyDelta = Partial<Currencies>;

export function getCurrencyUpdate(
    character: Currencies,
    delta: CurrencyDelta | undefined,
    direction: 1 | -1,
): CurrencyDelta {
    return delta
        ? {
              caps: character.caps + direction * (delta.caps ?? 0),
              ncrDollars: character.ncrDollars + direction * (delta.ncrDollars ?? 0),
              legionDenarius: character.legionDenarius + direction * (delta.legionDenarius ?? 0),
              prewarMoney: character.prewarMoney + direction * (delta.prewarMoney ?? 0),
          }
        : {};
}
