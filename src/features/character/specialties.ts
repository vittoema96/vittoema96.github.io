import { RawCharacter } from '@/types';
import { Origin } from '@/features/character/origin.ts';
import { useMemo } from 'react';
import { TraitId } from '@/features/character/feats/traits/traits.ts';


export function useSpecialties(raw: RawCharacter, origin: Origin, traits: TraitId[]){
    return useMemo(
        () => {
            // Ghoul origin adds Survival as specialty
            const specialtiesSet = new Set(raw.specialties)

            if (origin.id === 'ghoul') {
                specialtiesSet.add('survival');
            }

            if(traits.includes("traitNomad")){
                specialtiesSet.delete('science')
            }
            return [...specialtiesSet];
        }, [raw.specialties, traits, origin.id]
    )
}
