import { describe, it, expect } from 'vitest';
import { SkillResolver } from './skill-resolver.service.js';

describe('SkillResolver', () => {
    it('parses a simple slash command', () => {
        const parsed = SkillResolver.parseSlashCommand('/translate fr hello world');
        expect(parsed).not.toBeNull();
        expect(parsed?.slug).toBe('translate');
        expect(parsed?.args).toEqual(['fr', 'hello', 'world']);
        expect(parsed?.raw_args).toBe('fr hello world');
    });

    it('returns null for non-slash input', () => {
        expect(SkillResolver.parseSlashCommand('just text')).toBeNull();
    });
});
