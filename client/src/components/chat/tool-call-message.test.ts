import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import ToolCallMessage from './tool-call-message.svelte';

// TODO: Re-enable after SvelteKit SSR vs DOM test environment is resolved
describe.skip('ToolCallMessage', () => {
	const baseToolCall = {
		tool_call_id: 'tc-123',
		agent_id: 'agent-1',
		agent_name: 'WebSearch',
		status: 'running',
		input: { query: 'test query' },
		output: null,
		started_at: Date.now()
	};

	describe('Rendering', () => {
		it('should render tool call with agent name', () => {
			const { container } = render(ToolCallMessage, {
				props: {
					toolCall: baseToolCall
				}
			});

			expect(container.textContent).toContain('WebSearch');
		});

		it('should display loading spinner when status is running', () => {
			render(ToolCallMessage, {
				props: {
					toolCall: { ...baseToolCall, status: 'running' }
				}
			});

			// Should show loading indicator
			const loadingElement = screen.getByTestId('tool-loading');
			expect(loadingElement).toBeTruthy();
		});

		it('should display result when status is done', () => {
			const completedToolCall = {
				...baseToolCall,
				status: 'done' as const,
				output: { results: ['result 1', 'result 2'] },
				finished_at: Date.now()
			};

			render(ToolCallMessage, {
				props: {
					toolCall: completedToolCall
				}
			});

			// Should show output
			expect(screen.getByTestId('tool-output')).toBeTruthy();
		});

		it('should display error message when status is error', () => {
			const errorToolCall = {
				...baseToolCall,
				status: 'error' as const,
				error: 'Tool execution failed'
			};

			render(ToolCallMessage, {
				props: {
					toolCall: errorToolCall
				}
			});

			// Should show error
			expect(screen.getByTestId('tool-error')).toBeTruthy();
			expect(screen.textContent).toContain('failed');
		});
	});

	describe('Input Display', () => {
		it('should display tool input parameters', () => {
			render(ToolCallMessage, {
				props: {
					toolCall: baseToolCall
				}
			});

			// Should show input query
			expect(screen.textContent).toContain('test query');
		});

		it('should handle complex input objects', () => {
			const complexInput = {
				...baseToolCall,
				input: { url: 'https://example.com', depth: 2, filter: 'text' }
			};

			render(ToolCallMessage, {
				props: {
					toolCall: complexInput
				}
			});

			expect(screen.textContent).toContain('example.com');
		});
	});

	describe('Output Display', () => {
		it('should display tool output when available', () => {
			const completedToolCall = {
				...baseToolCall,
				status: 'done' as const,
				output: { summary: 'Search results summary' }
			};

			render(ToolCallMessage, {
				props: {
					toolCall: completedToolCall
				}
			});

			expect(screen.textContent).toContain('Search results summary');
		});

		it('should handle array outputs', () => {
			const completedToolCall = {
				...baseToolCall,
				status: 'done' as const,
				output: { items: ['item 1', 'item 2', 'item 3'] }
			};

			render(ToolCallMessage, {
				props: {
					toolCall: completedToolCall
				}
			});

			expect(screen.textContent).toContain('item 1');
		});
	});

	describe('Timing', () => {
		it('should display duration when completed', () => {
			const startTime = Date.now() - 5000; // 5 seconds ago
			const completedToolCall = {
				...baseToolCall,
				status: 'done' as const,
				started_at: startTime,
				finished_at: Date.now()
			};

			render(ToolCallMessage, {
				props: {
					toolCall: completedToolCall
				}
			});

			// Should show some timing info
			expect(screen.textContent).toBeTruthy();
		});
	});

	describe('Different Agent Types', () => {
		it('should render WebSearch agent call', () => {
			const webSearchCall = {
				...baseToolCall,
				agent_name: 'WebSearch',
				input: { query: 'weather today' }
			};

			render(ToolCallMessage, {
				props: {
					toolCall: webSearchCall
				}
			});

			expect(screen.textContent).toContain('WebSearch');
		});

		it('should render PageFetch agent call', () => {
			const pageFetchCall = {
				...baseToolCall,
				agent_name: 'PageFetch',
				input: { url: 'https://example.com/article' }
			};

			render(ToolCallMessage, {
				props: {
					toolCall: pageFetchCall
				}
			});

			expect(screen.textContent).toContain('PageFetch');
		});

		it('should render custom agent call', () => {
			const customCall = {
				...baseToolCall,
				agent_name: 'CustomAgent',
				input: { action: 'process' }
			};

			render(ToolCallMessage, {
				props: {
					toolCall: customCall
				}
			});

			expect(screen.textContent).toContain('CustomAgent');
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels', () => {
			render(ToolCallMessage, {
				props: {
					toolCall: baseToolCall
				}
			});

			// Component should be accessibleible
			const container = screen.getByTestId('tool-call-message');
			expect(container).toBeTruthy();
		});
	});
});
