import type { SkillType } from '@/features/character/skills/skills.ts';

export const ACTION_CATEGORIES = ['minor', 'major'] as const;
export type ActionCategory = (typeof ACTION_CATEGORIES)[number];

export interface ActionDefinition {
    id: string;
    category: ActionCategory;
    rollSkill?: SkillType;
}

export const ACTIONS: readonly ActionDefinition[] = [
    { id: 'actionAim', category: 'minor' },
    { id: 'actionDrawItem', category: 'minor' },
    { id: 'actionInteract', category: 'minor' },
    { id: 'actionMove', category: 'minor' },
    { id: 'actionTakeChem', category: 'minor' },
    { id: 'actionAssist', category: 'major' },
    { id: 'actionAttack', category: 'major' },
    { id: 'actionCommandNpc', category: 'major' },
    { id: 'actionFirstAid', category: 'major', rollSkill: 'medicine' },
    { id: 'actionDefend', category: 'major', rollSkill: 'athletics' },
    { id: 'actionPass', category: 'major' },
    { id: 'actionRally', category: 'major', rollSkill: 'survival' },
    { id: 'actionReady', category: 'major' },
    { id: 'actionSprint', category: 'major' },
    { id: 'actionTest', category: 'major' },
];
