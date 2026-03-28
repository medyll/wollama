import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ChatWindow from './ChatWindow.svelte';

// Mock dependencies
vi.mock('$lib/state/i18n.svelte', () => ({
	t: (key: string) => key
}));

vi.mock('$lib/state/user.svelte', () => ({
	userState: {
		uid: 'test-user-123',
		preferences: {
			defaultModel: 'mistral:latest'
		}
	}
}));

vi.mock('$lib/state/ui.svelte', () => ({
	uiState: {
		clearTitle: vi.fn(),
		setActiveCompanionId: vi.fn()
	}
}));

vi.mock('$lib/state/notifications.svelte', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn()
	}
}));

vi.mock('$lib/services/audio.service', () => ({
	audioService: {
		isRecording: false,
		startRecording: vi.fn(),
		stopRecording: vi.fn()
	}
}));

vi.mock('$lib/services/chat.service', () => ({
	chatService: {
		sendMessage: vi.fn(),
		getChatHistory: vi.fn()
	}
}));

vi.mock('$lib/services/data-generic.service', () => ({
	DataGenericService: vi.fn().mockImplementation(() => ({
		get: vi.fn().mockResolvedValue(null)
	}))
}));

vi.mock('$lib/utils/markdown', () => ({
	parseMarkdown: (text: string) => text
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// TODO: Re-enable after SvelteKit SSR vs DOM test environment is resolved
describe.skip('ChatWindow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render empty chat state when no chatId provided', () => {
			render(ChatWindow, { props: {} });

			// Should render chat input area
			expect(screen.getByTestId('chat-input')).toBeTruthy();
		});

		it('should render with initial companion when provided', async () => {
			render(ChatWindow, {
				props: {
					initialCompanionId: 'comp-123'
				}
			});

			// Should show companion selector or current companion info
			await waitFor(() => {
				expect(screen.queryByTestId('chat-container')).toBeTruthy();
			});
		});

		it('should display messages when chatId is provided', async () => {
			// Mock chat service to return messages
			vi.mocked(await import('$lib/services/chat.service')).chatService.getChatHistory = vi
				.fn()
				.mockResolvedValue([
					{ message_id: '1', role: 'user', content: 'Hello' },
					{ message_id: '2', role: 'assistant', content: 'Hi there!' }
				]);

			render(ChatWindow, {
				props: {
					chatId: 'chat-123'
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Hello')).toBeTruthy();
				expect(screen.getByText('Hi there!')).toBeTruthy();
			});
		});
	});

	describe('Chat Input', () => {
		it('should allow typing in the message input', async () => {
			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('chat-input') as HTMLTextAreaElement;
			await fireEvent.change(input, { target: { value: 'Test message' } });

			expect(input.value).toBe('Test message');
		});

		it('should send message on Enter key (without Shift)', async () => {
			const mockSendMessage = vi.fn().mockResolvedValue({});
			vi.mocked(await import('$lib/services/chat.service')).chatService.sendMessage = mockSendMessage;

			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('chat-input') as HTMLTextAreaElement;
			await fireEvent.change(input, { target: { value: 'Test message' } });
			await fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

			await waitFor(() => {
				expect(mockSendMessage).toHaveBeenCalled();
			});
		});

		it('should create new line on Shift+Enter', async () => {
			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('chat-input') as HTMLTextAreaElement;
			await fireEvent.change(input, { target: { value: 'Line 1' } });
			await fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

			expect(input.value).toBe('Line 1');
		});
	});

	describe('Message List', () => {
		it('should auto-scroll to bottom when new message arrives', async () => {
			const mockScrollTo = vi.fn();
			const mockContainer = { scrollTo: mockScrollTo, scrollHeight: 1000, clientHeight: 500, scrollTop: 0 };

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			// Simulate message arrival
			await waitFor(() => {
				expect(mockScrollTo).toHaveBeenCalled();
			});
		});

		it('should disable auto-scroll when user scrolls up', async () => {
			render(ChatWindow, { props: { chatId: 'chat-123' } });

			const container = screen.getByTestId('chat-container');
			await fireEvent.scroll(container, { target: { scrollTop: 500 } });

			// User has scrolled up, auto-scroll should be disabled
			expect(container).toBeTruthy();
		});
	});

	describe('Companion Selection', () => {
		it('should open companion selector modal', async () => {
			render(ChatWindow, { props: {} });

			const companionBtn = screen.getByTestId('open-companion-selector');
			await fireEvent.click(companionBtn);

			await waitFor(() => {
				expect(screen.getByTestId('companion-selector-modal')).toBeTruthy();
			});
		});

		it('should update current companion when selected', async () => {
			render(ChatWindow, { props: {} });

			// Open modal and select companion
			const companionBtn = screen.getByTestId('open-companion-selector');
			await fireEvent.click(companionBtn);

			const companionOption = screen.getByTestId('companion-option-1');
			await fireEvent.click(companionOption);

			await waitFor(() => {
				expect(screen.queryByTestId('companion-selector-modal')).toBeFalsy();
			});
		});
	});

	describe('Recording', () => {
		it('should toggle recording state when mic button clicked', async () => {
			render(ChatWindow, { props: {} });

			const micBtn = screen.getByTestId('mic-button');
			await fireEvent.click(micBtn);

			// Should start recording
			expect(vi.mocked(await import('$lib/services/audio.service')).audioService.startRecording).toHaveBeenCalled();
		});
	});
});
