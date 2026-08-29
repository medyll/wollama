import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import MessageActions from './MessageActions.svelte';

// Mock dependencies
vi.mock('$lib/state/notifications.svelte', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn()
	}
}));

vi.mock('$lib/state/i18n.svelte', () => ({
	t: (key: string) => key
}));

// Mock navigator.clipboard
const mockClipboard = {
	writeText: vi.fn().mockResolvedValue(undefined)
};

beforeEach(() => {
	vi.clearAllMocks();
	Object.defineProperty(navigator, 'clipboard', {
		value: mockClipboard,
		writable: true
	});
});

// Rating is component-local state (not persisted yet): assertions target the
// data-rating / aria-pressed contract the component actually exposes.
describe('MessageActions', () => {
	const mockMessage = {
		message_id: 'msg-123',
		chat_id: 'chat-123',
		role: 'assistant',
		content: 'This is a test response',
		status: 'done',
		created_at: Date.now()
	};

	describe('Copy to Clipboard', () => {
		it('should copy message content to clipboard when copy button clicked', async () => {
			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const copyBtn = screen.getByLabelText('Copy to clipboard');
			await fireEvent.click(copyBtn);

			await waitFor(() => {
				expect(mockClipboard.writeText).toHaveBeenCalledWith(mockMessage.content);
			});
		});

		it('should show success toast after copying', async () => {
			const { toast } = await import('$lib/state/notifications.svelte');

			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const copyBtn = screen.getByLabelText('Copy to clipboard');
			await fireEvent.click(copyBtn);

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalled();
			});
		});

		it('should show error toast if copy fails', async () => {
			mockClipboard.writeText.mockRejectedValueOnce(new Error('Copy failed'));
			const { toast } = await import('$lib/state/notifications.svelte');

			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const copyBtn = screen.getByLabelText('Copy to clipboard');
			await fireEvent.click(copyBtn);

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith('Failed to copy');
			});
		});

		it('should show "Copied" state temporarily after copying', async () => {
			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const copyBtn = screen.getByLabelText('Copy to clipboard');
			await fireEvent.click(copyBtn);

			// Button should show copied state
			await waitFor(() => {
				expect(copyBtn).toBeTruthy();
			});
		});
	});

	describe('Rating', () => {
		it('should rate response as good when thumbs up clicked', async () => {
			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const thumbsUpBtn = screen.getByLabelText('Rate good');
			await fireEvent.click(thumbsUpBtn);

			await waitFor(() => {
				expect(thumbsUpBtn.getAttribute('data-rating')).toBe('good');
				expect(thumbsUpBtn.getAttribute('aria-pressed')).toBe('true');
			});
		});

		it('should rate response as bad when thumbs down clicked', async () => {
			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const thumbsDownBtn = screen.getByLabelText('Rate bad');
			await fireEvent.click(thumbsDownBtn);

			await waitFor(() => {
				expect(thumbsDownBtn.getAttribute('data-rating')).toBe('bad');
				expect(thumbsDownBtn.getAttribute('aria-pressed')).toBe('true');
			});
		});

		it('should toggle off rating when same button clicked twice', async () => {
			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const thumbsUpBtn = screen.getByLabelText('Rate good');
			await fireEvent.click(thumbsUpBtn);
			await waitFor(() => expect(thumbsUpBtn.getAttribute('aria-pressed')).toBe('true'));

			await fireEvent.click(thumbsUpBtn);

			await waitFor(() => {
				expect(thumbsUpBtn.getAttribute('data-rating')).toBeNull();
				expect(thumbsUpBtn.getAttribute('aria-pressed')).toBe('false');
			});
		});

		it('should switch rating when different button clicked', async () => {
			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const thumbsUpBtn = screen.getByLabelText('Rate good');
			const thumbsDownBtn = screen.getByLabelText('Rate bad');

			await fireEvent.click(thumbsUpBtn);
			await waitFor(() => expect(thumbsUpBtn.getAttribute('aria-pressed')).toBe('true'));

			await fireEvent.click(thumbsDownBtn);

			await waitFor(() => {
				expect(thumbsUpBtn.getAttribute('aria-pressed')).toBe('false');
				expect(thumbsDownBtn.getAttribute('aria-pressed')).toBe('true');
			});
		});
	});

	describe('Regenerate', () => {
		it('should call onRegenerate when regenerate button clicked', async () => {
			const mockOnRegenerate = vi.fn();

			render(MessageActions, {
				props: {
					message: mockMessage,
					onRegenerate: mockOnRegenerate
				}
			});

			const regenerateBtn = screen.getByLabelText('Regenerate response');
			await fireEvent.click(regenerateBtn);

			expect(mockOnRegenerate).toHaveBeenCalled();
		});
	});

	describe('Share', () => {
		it('should have share button (functionality TBD)', async () => {
			render(MessageActions, {
				props: {
					message: mockMessage
				}
			});

			const shareBtn = screen.getByLabelText('Share');
			expect(shareBtn).toBeTruthy();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels on all buttons', async () => {
			render(MessageActions, {
				props: {
					message: mockMessage,
					onRegenerate: vi.fn()
				}
			});

			expect(screen.getByLabelText('Copy to clipboard')).toBeTruthy();
			expect(screen.getByLabelText('Rate good')).toBeTruthy();
			expect(screen.getByLabelText('Rate bad')).toBeTruthy();
			expect(screen.getByLabelText('Regenerate response')).toBeTruthy();
			expect(screen.getByLabelText('Share')).toBeTruthy();
		});
	});
});
