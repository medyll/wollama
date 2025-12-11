import { describe, it, expect } from 'vitest';
import { parseThinking } from './thinking';

describe('Thinking Utils', () => {
    it('should handle empty or null content', () => {
        expect(parseThinking(null)).toEqual({ pre: null, thinking: null, response: '', isThinking: false });
        expect(parseThinking(undefined)).toEqual({ pre: null, thinking: null, response: '', isThinking: false });
        expect(parseThinking('')).toEqual({ pre: null, thinking: null, response: '', isThinking: false });
    });

    it('should handle content without thinking tags', () => {
        const content = 'Hello world';
        expect(parseThinking(content)).toEqual({ pre: null, thinking: null, response: 'Hello world', isThinking: false });
    });

    it('should handle content with open thinking tag (streaming)', () => {
        const content = 'Hello <think>I am thinking...';
        expect(parseThinking(content)).toEqual({ 
            pre: 'Hello ', 
            thinking: 'I am thinking...', 
            response: null, 
            isThinking: true 
        });
    });

    it('should handle content with complete thinking tags', () => {
        const content = 'Hello <think>I thought about it.</think> Here is the answer.';
        expect(parseThinking(content)).toEqual({ 
            pre: 'Hello ', 
            thinking: 'I thought about it.', 
            response: ' Here is the answer.', 
            isThinking: false 
        });
    });

    it('should handle thinking at the start', () => {
        const content = '<think>Thinking...</think>Answer';
        expect(parseThinking(content)).toEqual({ 
            pre: '', 
            thinking: 'Thinking...', 
            response: 'Answer', 
            isThinking: false 
        });
    });
});
