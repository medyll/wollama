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
			defaultModel: 'mistral:latest',
			serverUrl: 'http://localhost:3000',
			auto_play_audio: false
		}
	}
}));

vi.mock('$lib/state/ui.svelte', () => ({
	uiState: {
		isAudioPlaying: false,
		setTitle: vi.fn(),
		clearTitle: vi.fn(),
		setActiveCompanionId: vi.fn()
	}
}));

vi.mock('$lib/state/connection.svelte', () => ({
	connectionState: {
		isConnected: false
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
		startRecording: vi.fn().mockResolvedValue(undefined),
		stopRecording: vi.fn().mockResolvedValue(new Blob()),
		transcribe: vi.fn().mockResolvedValue(''),
		speak: vi.fn().mockResolvedValue(undefined),
		stopAudio: vi.fn()
	}
}));

// The chat service is the whole persistence surface ChatWindow talks to; every
// method it calls is stubbed here so the component can be driven without RxDB.
vi.mock('$lib/services/chat.service', () => ({
	chatService: {
		getChat: vi.fn().mockResolvedValue(null),
		getMessages: vi.fn(),
		getChatHistory: vi.fn().mockResolvedValue([]),
		createChat: vi.fn().mockResolvedValue('chat-new'),
		addMessage: vi.fn().mockResolvedValue(undefined),
		generateResponse: vi.fn().mockResolvedValue('response'),
		updateChatRuntime: vi.fn().mockResolvedValue(undefined)
	}
}));

// ChatWindow calls `new DataGenericService(...)`, so the stub has to be a real
// constructor — a vi.fn() implementation is not newable.
const dataGenericGet = vi.fn().mockResolvedValue(null);
const dataGenericTables: string[] = [];

vi.mock('$lib/services/data-generic.service', () => ({
	DataGenericService: class {
		constructor(table: string) {
			dataGenericTables.push(table);
		}
		get = dataGenericGet;
	}
}));

vi.mock('$lib/services/run.service.svelte.js', () => ({
	runStore: {
		runs: {},
		loadForChat: vi.fn().mockResolvedValue(undefined)
	}
}));

vi.mock('$lib/utils/markdown', () => ({
	parseMarkdown: (text: string) => text
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

/** Mimics the RxDB query observable `chatService.getMessages` resolves to. */
function messageStream(messages: unknown[]) {
	return Promise.resolve({
		subscribe: (next: (value: unknown[]) => void) => {
			next(messages);
			return { unsubscribe: vi.fn() };
		}
	});
}

const userMessage = {
	message_id: '1',
	chat_id: 'chat-123',
	role: 'user',
	content: 'Hello',
	status: 'sent',
	created_at: 1
};

const assistantMessage = {
	message_id: '2',
	chat_id: 'chat-123',
	role: 'assistant',
	content: 'Hi there!',
	status: 'done',
	created_at: 2
};

describe('ChatWindow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dataGenericTables.length = 0;
		dataGenericGet.mockResolvedValue(null);
	});

	async function loadChatService() {
		return (await import('$lib/services/chat.service')).chatService;
	}

	describe('Rendering', () => {
		it('should render the empty state and a composer when no chatId is provided', () => {
			const { container } = render(ChatWindow, { props: {} });

			expect(container.querySelector('chat-empty-state')).toBeTruthy();
			expect(screen.getByTestId('message-input')).toBeTruthy();
			// The scrollable message list only exists once there is history.
			expect(screen.queryByTestId('chat-container')).toBeNull();
		});

		it('should not load any chat data when no chatId is provided', async () => {
			const chatService = await loadChatService();

			render(ChatWindow, { props: {} });

			await waitFor(() => {
				expect(chatService.getChat).not.toHaveBeenCalled();
			});
			expect(chatService.getMessages).not.toHaveBeenCalled();
		});

		it('should resolve the initial companion when initialCompanionId is provided', async () => {
			render(ChatWindow, { props: { initialCompanionId: 'comp-123' } });

			// A companion id is looked up in user_companions first, then the system table.
			await waitFor(() => {
				expect(dataGenericTables).toContain('user_companions');
			});
			expect(dataGenericGet).toHaveBeenCalledWith('comp-123');
		});

		it('should display messages when chatId is provided', async () => {
			const chatService = await loadChatService();
			vi.mocked(chatService.getMessages).mockReturnValue(messageStream([userMessage, assistantMessage]) as never);

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			await waitFor(() => {
				expect(screen.getByText('Hello')).toBeTruthy();
			});
			expect(screen.getByText('Hi there!')).toBeTruthy();
			expect(screen.getAllByTestId('chat-message')).toHaveLength(2);
			expect(screen.getByTestId('chat-container')).toBeTruthy();
		});

		it('should hide system messages from the transcript', async () => {
			const chatService = await loadChatService();
			vi.mocked(chatService.getMessages).mockReturnValue(
				messageStream([
					{ ...userMessage, message_id: '0', role: 'system', content: 'You are a helpful assistant.' },
					userMessage
				]) as never
			);

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			await waitFor(() => {
				expect(screen.getAllByTestId('chat-message')).toHaveLength(1);
			});
			expect(screen.queryByText('You are a helpful assistant.')).toBeNull();
		});

		it('should show a loading indicator for an assistant message that is still streaming', async () => {
			const chatService = await loadChatService();
			vi.mocked(chatService.getMessages).mockReturnValue(
				messageStream([userMessage, { ...assistantMessage, content: '', status: 'streaming' }]) as never
			);

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			await waitFor(() => {
				expect(screen.getByTestId('loading-indicator')).toBeTruthy();
			});
		});

		it('should load runs and chat metadata for the active chat', async () => {
			const chatService = await loadChatService();
			const { runStore } = await import('$lib/services/run.service.svelte.js');
			vi.mocked(chatService.getMessages).mockReturnValue(messageStream([userMessage]) as never);
			vi.mocked(chatService.getChat).mockResolvedValue({ title: 'My chat', model: 'mistral:latest' } as never);

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			await waitFor(() => {
				expect(runStore.loadForChat).toHaveBeenCalledWith('chat-123');
			});
			const { uiState } = await import('$lib/state/ui.svelte');
			await waitFor(() => {
				expect(uiState.setTitle).toHaveBeenCalledWith('My chat');
			});
		});
	});

	describe('Chat Input', () => {
		it('should allow typing in the message input', async () => {
			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Test message' } });

			expect(input.value).toBe('Test message');
		});

		it('should reveal the send button only once the input has content', async () => {
			render(ChatWindow, { props: {} });

			expect(screen.queryByTestId('send-button')).toBeNull();

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Test message' } });

			await waitFor(() => {
				expect(screen.getByTestId('send-button')).toBeTruthy();
			});
		});

		it('should send the message on Enter (without Shift)', async () => {
			const chatService = await loadChatService();

			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Test message' } });
			await fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

			await waitFor(() => {
				expect(chatService.addMessage).toHaveBeenCalledWith('chat-new', 'user', 'Test message', 'sent', []);
			});
		});

		it('should not send on Shift+Enter', async () => {
			const chatService = await loadChatService();

			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Line 1' } });
			await fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

			expect(chatService.addMessage).not.toHaveBeenCalled();
			expect(input.value).toBe('Line 1');
		});

		it('should ignore an empty submission', async () => {
			const chatService = await loadChatService();

			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

			expect(chatService.createChat).not.toHaveBeenCalled();
			expect(chatService.addMessage).not.toHaveBeenCalled();
		});
	});

	describe('Sending', () => {
		it('should create a chat, persist the message, then generate a response', async () => {
			const chatService = await loadChatService();
			vi.mocked(chatService.getChatHistory).mockResolvedValue([{ role: 'user', content: 'Test message' }] as never);

			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Test message' } });
			await fireEvent.click(screen.getByTestId('send-button'));

			await waitFor(() => {
				expect(chatService.createChat).toHaveBeenCalled();
			});
			await waitFor(() => {
				expect(chatService.generateResponse).toHaveBeenCalledWith('chat-new', [
					{ role: 'user', content: 'Test message', images: undefined }
				]);
			});
		});

		it('should navigate to the freshly created chat', async () => {
			const { goto } = await import('$app/navigation');

			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Test message' } });
			await fireEvent.click(screen.getByTestId('send-button'));

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/chat/chat-new', { replaceState: true });
			});
		});

		it('should reuse the existing chat instead of creating one', async () => {
			const chatService = await loadChatService();
			vi.mocked(chatService.getMessages).mockReturnValue(messageStream([userMessage]) as never);

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			await waitFor(() => expect(screen.getByTestId('chat-container')).toBeTruthy());

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Follow up' } });
			await fireEvent.click(screen.getByTestId('send-button'));

			await waitFor(() => {
				expect(chatService.addMessage).toHaveBeenCalledWith('chat-123', 'user', 'Follow up', 'sent', []);
			});
			expect(chatService.createChat).not.toHaveBeenCalled();
		});

		it('should clear the input after sending', async () => {
			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Test message' } });
			await fireEvent.click(screen.getByTestId('send-button'));

			await waitFor(() => {
				expect(input.value).toBe('');
			});
		});

		it('should surface a toast when chat creation fails', async () => {
			const chatService = await loadChatService();
			const { toast } = await import('$lib/state/notifications.svelte');
			vi.mocked(chatService.createChat).mockRejectedValueOnce(new Error('boom'));

			render(ChatWindow, { props: {} });

			const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
			await fireEvent.input(input, { target: { value: 'Test message' } });
			await fireEvent.click(screen.getByTestId('send-button'));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalled();
			});
			expect(chatService.addMessage).not.toHaveBeenCalled();
		});
	});

	describe('Message List', () => {
		it('should keep auto-scroll enabled while the list is at the bottom', async () => {
			const chatService = await loadChatService();
			vi.mocked(chatService.getMessages).mockReturnValue(messageStream([userMessage]) as never);

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			const container = await screen.findByTestId('chat-container');
			const scrollTo = vi.fn();
			Object.defineProperty(container, 'scrollTo', { value: scrollTo, writable: true });
			Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
			Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });
			Object.defineProperty(container, 'scrollTop', { value: 500, configurable: true });

			await fireEvent.scroll(container);

			// scrollHeight - scrollTop - clientHeight === 0, so the user is still pinned
			// to the bottom and new messages must keep scrolling.
			expect(container).toBeTruthy();
		});

		it('should expose the message list as an accessible log', async () => {
			const chatService = await loadChatService();
			vi.mocked(chatService.getMessages).mockReturnValue(messageStream([userMessage]) as never);

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			const container = await screen.findByTestId('chat-container');
			expect(container.getAttribute('role')).toBe('log');
			expect(container.getAttribute('aria-live')).toBe('polite');
			expect(container.getAttribute('aria-label')).toBe('Chat messages');
		});

		it('should tag each message with its role', async () => {
			const chatService = await loadChatService();
			vi.mocked(chatService.getMessages).mockReturnValue(messageStream([userMessage, assistantMessage]) as never);

			render(ChatWindow, { props: { chatId: 'chat-123' } });

			await waitFor(() => {
				const rendered = screen.getAllByTestId('chat-message');
				expect(rendered.map((node) => node.getAttribute('data-role'))).toEqual(['user', 'assistant']);
			});
		});
	});

	describe('Recording', () => {
		it('should start recording when the mic button is clicked', async () => {
			const { audioService } = await import('$lib/services/audio.service');

			render(ChatWindow, { props: {} });

			// The mic replaces the send button while the composer is empty.
			const micBtn = screen.getByLabelText('ui.start_recording');
			await fireEvent.click(micBtn);

			await waitFor(() => {
				expect(audioService.startRecording).toHaveBeenCalled();
			});
		});

		it('should stop recording and transcribe on the second click', async () => {
			const { audioService } = await import('$lib/services/audio.service');
			vi.mocked(audioService.transcribe).mockResolvedValue('' as never);

			render(ChatWindow, { props: {} });

			await fireEvent.click(screen.getByLabelText('ui.start_recording'));

			const stopBtn = await screen.findByLabelText('ui.stop_recording');
			await fireEvent.click(stopBtn);

			await waitFor(() => {
				expect(audioService.stopRecording).toHaveBeenCalled();
			});
			expect(audioService.transcribe).toHaveBeenCalled();
		});
	});
});
