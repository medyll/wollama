import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './markdown';

describe('Markdown Utils', () => {
    it('should parse basic markdown', () => {
        const input = '# Hello World';
        const output = parseMarkdown(input);
        expect(output).toContain('<h1>Hello World</h1>');
    });

    it('should parse bold text', () => {
        const input = '**Bold**';
        const output = parseMarkdown(input);
        expect(output).toContain('<strong>Bold</strong>');
    });

    it('should handle code blocks with custom renderer', () => {
        const input = '```javascript\nconsole.log("test");\n```';
        const output = parseMarkdown(input);
        expect(output).toContain('mockup-code');
        expect(output).toContain('language-javascript');
        expect(output).toContain('console.log');
    });
});
