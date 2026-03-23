import type { ParsedSlashCommand, Skill } from '../../shared/types/skills.js';
import { dbManager } from '../db/database.js';

export class SkillResolver {
    static parseSlashCommand(input: string): ParsedSlashCommand | null {
        if (!input || typeof input !== 'string') return null;
        const trimmed = input.trim();
        if (!trimmed.startsWith('/')) return null;
        const parts = trimmed.split(/\s+/);
        const command = parts[0];
        const slug = command.startsWith('/') ? command.slice(1) : command;
        const args = parts.slice(1);
        return {
            slug,
            command,
            args,
            raw_args: args.join(' ')
        };
    }

    static async findSkillBySlug(slug: string): Promise<Skill | null> {
        if (!slug) return null;
        const db = dbManager.getDb('skills');
        try {
            // Try by `name` (slug) first
            const byName = await db.find({ selector: { name: slug }, limit: 1 });
            if (byName.docs && byName.docs.length > 0) return byName.docs[0] as Skill;

            // Fallback: find by command (e.g. "/translate")
            const byCmd = await db.find({ selector: { command: '/' + slug }, limit: 1 });
            if (byCmd.docs && byCmd.docs.length > 0) return byCmd.docs[0] as Skill;
        } catch (e) {
            // ignore and return null
            // console.warn('SkillResolver.findSkillBySlug error', e);
        }
        return null;
    }
}

export default SkillResolver;
