import helpSkill from './help.skill.js';
import translateSkill from './translate.skill.js';
import summarizeSkill from './summarize.skill.js';

type SkillHandler = (args: string[], context?: any) => Promise<any> | any;

const registry: Record<string, SkillHandler> = {
    help: helpSkill,
    translate: translateSkill,
    summarize: summarizeSkill
};

export const getBuiltinHandler = (ref: string): SkillHandler | null => {
    if (!ref) return null;
    // handler_ref may be 'help' or 'skills/help' etc. Normalize simple names
    const key = ref.includes('/') ? ref.split('/').pop() || ref : ref;
    return registry[key] ?? null;
};

export default registry;
