import { RawCharacter } from '@/types';
import type { Origin } from '@/features/character/origins/types';
import { TraitId } from '@/features/character/feats/traits.ts';
import { SkillType } from '@/features/character/skills/skills.ts';
import {
    getBlacklistedSpecialties,
    getWhitelistedSpecialties,
    getSpecialtySkillBonuses,
    getSpecialtyPointsBonus,
} from '@/features/character/feats/rules';
import { PerkId } from '@/features/character/feats/perks.ts';


export function calculateSpecialties(raw: RawCharacter, origin: Origin, traits: TraitId[]){
    const specialtiesSet = new Set(raw.specialties)

    getWhitelistedSpecialties(raw.perks, traits, origin)
        .forEach(skill => specialtiesSet.add(skill));

    getBlacklistedSpecialties(raw.perks, traits, origin)
        .forEach(skill => specialtiesSet.delete(skill));
    return [...specialtiesSet];
}

export function calculateSpecialtyPoints(specialties: SkillType[], origin: Origin, perks: PerkId[], traits: TraitId[]){
   let genericPointsUsed = 0;

    type BonusType = {
        bonus: number,
        skills: SkillType[]
    }
    const bonuses: BonusType[] = [
        ...getSpecialtySkillBonuses(perks, traits, origin).map(({ bonus, skills }) => ({
            bonus,
            skills: [...skills],
        })),
    ];

    specialties.forEach(skill => {
        let coveredByBonus = false;

        // TODO we need to handle where to remove points first if both contain the skill
        //      ie repair and science are in both brotherhoodInitiate and in goodNatured
        // CURRENTLY not a problem as one can't have both goodNatured and brotherhoodInitiate
        for (const b of bonuses.toSorted((a, b) => (a.skills.length - b.skills.length) || (a.bonus - b.bonus))) {
            if(b.bonus > 0){
                const index = b.skills.indexOf(skill)
                if(index > -1){
                    coveredByBonus = true;
                    b.skills = b.skills.filter((_, i) => i !== index);
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
        getSpecialtyPointsBonus(perks, traits, origin);

    return {
        generic: totalGenericAllowed - genericPointsUsed,
        bonus: bonuses.map(b => { return {remaining: b.bonus, skills: b.skills} })
    };
}
