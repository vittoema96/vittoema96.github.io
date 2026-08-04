import { PerkImplementation } from '@/features/character/feats';
import { getSpecialFromSkill } from '@/features/character/skills/skills.ts';


const perkAdrenalineRush: PerkImplementation = {
    id: 'perkAdrenalineRush',
    getRollSpecialModifiers: (character, context) => {
        const isInjured = character.currentHp < character.maxHp;
        if (!isInjured) {
            return [];
        }

        const isStrengthSkillCheck =
            context.skillId
            && getSpecialFromSkill(context.skillId) === 'strength';
        // TODO CHECK: No need to check for melee attack as those already use STR

        if (!isStrengthSkillCheck) {
            return [];
        }

        return [{ special: 'strength', apply: () => 10 }];
    },
}

export default perkAdrenalineRush;

