import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ToolCallMessage from './tool-call-message.svelte';

// Contract: the component is a pure renderer over a single `message` prop
// ({ toolName, toolId, timestamp, inputs, outputs? }). Status, duration and
// error rendering live in the run/tool-call card, not here.
describe('ToolCallMessage', () => {
	const baseMessage = {
		toolName: 'WebSearch',
		toolId: 'tc-123',
		timestamp: Date.UTC(2026, 0, 15, 10, 30),
		inputs: { query: 'test query' }
	};

	describe('Rendering', () => {
		it('should render the tool name', () => {
			const { container } = render(ToolCallMessage, { props: { message: baseMessage } });

			expect(container.textContent).toContain('Tool: WebSearch');
		});

		it('should render the tool call id', () => {
			const { container } = render(ToolCallMessage, { props: { message: baseMessage } });

			expect(container.textContent).toContain('tc-123');
		});

		it('should render a formatted timestamp', () => {
			const { container } = render(ToolCallMessage, { props: { message: baseMessage } });

			expect(container.textContent).toContain(new Date(baseMessage.timestamp).toLocaleString());
		});

		it('should render inside a tool-call-message element', () => {
			const { container } = render(ToolCallMessage, { props: { message: baseMessage } });

			expect(container.querySelector('tool-call-message')).toBeTruthy();
		});
	});

	describe('Input Display', () => {
		it('should display tool input parameters as JSON', () => {
			const { container } = render(ToolCallMessage, { props: { message: baseMessage } });

			expect(container.textContent).toContain('test query');
		});

		it('should handle complex input objects', () => {
			const { container } = render(ToolCallMessage, {
				props: {
					message: {
						...baseMessage,
						inputs: { url: 'https://example.com', depth: 2, filter: 'text' }
					}
				}
			});

			expect(container.textContent).toContain('example.com');
			expect(container.textContent).toContain('depth');
		});

		it('should always expose an Inputs disclosure', () => {
			render(ToolCallMessage, { props: { message: baseMessage } });

			expect(screen.getByText('Inputs')).toBeTruthy();
		});
	});

	describe('Output Display', () => {
		it('should not render an Outputs disclosure when outputs are absent', () => {
			render(ToolCallMessage, { props: { message: baseMessage } });

			expect(screen.queryByText('Outputs')).toBeNull();
		});

		it('should display tool output when available', () => {
			const { container } = render(ToolCallMessage, {
				props: {
					message: { ...baseMessage, outputs: { summary: 'Search results summary' } }
				}
			});

			expect(screen.getByText('Outputs')).toBeTruthy();
			expect(container.textContent).toContain('Search results summary');
		});

		it('should handle array outputs', () => {
			const { container } = render(ToolCallMessage, {
				props: {
					message: { ...baseMessage, outputs: { items: ['item 1', 'item 2', 'item 3'] } }
				}
			});

			expect(container.textContent).toContain('item 1');
			expect(container.textContent).toContain('item 3');
		});
	});

	describe('Different Agent Types', () => {
		it('should render a PageFetch tool call', () => {
			const { container } = render(ToolCallMessage, {
				props: {
					message: {
						...baseMessage,
						toolName: 'PageFetch',
						inputs: { url: 'https://example.com/article' }
					}
				}
			});

			expect(container.textContent).toContain('PageFetch');
			expect(container.textContent).toContain('example.com/article');
		});

		it('should render a custom tool call', () => {
			const { container } = render(ToolCallMessage, {
				props: {
					message: { ...baseMessage, toolName: 'CustomAgent', inputs: { action: 'process' } }
				}
			});

			expect(container.textContent).toContain('CustomAgent');
			expect(container.textContent).toContain('process');
		});
	});
});
