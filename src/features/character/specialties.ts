import { Character, RawCharacter } from '@/types';
import { Origin, ORIGINS } from '@/features/character/origin.ts';
import { useMemo } from 'react';
import { hasTrait, TraitId } from '@/features/character/feats/traits/traits.ts';
import { SkillType } from '@/features/character/skills/skills.ts';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


export function useSpecialties(raw: RawCharacter, origin: Origin, traits: TraitId[]){
    return useMemo(
        () => {
            // Ghoul origin adds Survival as specialty
            const specialtiesSet = new Set(raw.specialties)

            if (origin === ORIGINS.GHOUL) {
                specialtiesSet.add('survival');
            }

            if(hasTrait(traits, "traitNomad")){
                specialtiesSet.delete('science')
            }
            return [...specialtiesSet];
        }, [raw.specialties, traits, origin]
    )
}

export function useSpecialtyPoints(character: Character){
    return useMemo(() => {

        let genericPointsUsed = 0;

        type BonusType = {
            condition: boolean,
            bonus: number,
            skills: SkillType[]
        }
        const allBonuses: BonusType[] = [
            {
                condition: hasTrait(character, "traitGoodNatured"),
                bonus: 2,
                skills: ['speech', 'medicine', 'repair', 'science', 'barter']
            },
            {
                condition: character.origin === ORIGINS.BROTHERHOOD_INITIATE,
                bonus: 1,
                skills: ['energyWeapons', 'science', 'repair']
            },
        ]
        const bonuses = allBonuses.filter(b => b.condition);

        character.specialties.forEach(skill => {
            let coveredByBonus = false;

            // TODO we need to handle where to remove points first if both contain the skill
            //      ie repair and science are in both brotherhoodInitiate and in goodNatured
            // CURRENTLY not a problem as one can't have both goodNatured and brotherhoodInitiate
            for (const b of bonuses.toSorted((a, b) => (a.skills.length - b.skills.length) || (a.bonus - b.bonus))) {
                if(b.bonus > 0){
                    const index = b.skills.indexOf(skill)
                    if(index > -1){
                        coveredByBonus = true;
                        b.skills.splice(index, 1)
                        b.bonus -= 1
                    }
                }
            }

            if(!coveredByBonus){
                genericPointsUsed++;
            }
        });

        const totalGenericAllowed =
            3 +
            Number( hasTrait(character, "traitEducated") ) +
            perkRank(character, 'perkTag') +
            (character.origin === ORIGINS.GHOUL ? 1 : 0); // ghouls have survival as extra specialty (and it should not count)

        return {
            generic: totalGenericAllowed - genericPointsUsed,
            bonus: bonuses.map(b => { return {remaining: b.bonus, skills: b.skills} })
        };
    }, [character.specialties, character.traits, character.perks, character.origin]);
}
