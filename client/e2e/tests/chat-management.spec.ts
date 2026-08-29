/**
 * E2E Tests - Chat Management (S7-07)
 *
 * Covers the chat lifecycle as the app actually implements it:
 * 1. Start a new chat from the sidebar
 * 2. A chat row is created on the first message, and appears in the sidebar
 * 3. Assistant replies stream into the transcript
 * 4. Switching between chats keeps each transcript isolated
 * 5. Deleting a chat from the composer toolbar (with confirmation)
 *
 * Renaming is deliberately not covered: titles are generated on creation and the
 * UI exposes no rename control. Add specs here when one ships.
 */

import { test, expect } from '@playwright/test';
import {
	setupTestState,
	waitForChatReady,
	createNewChat,
	sendMessage,
	mockChatGeneration,
	mockServerHealth,
	deleteCurrentChat
} from '../fixtures/test-setup';

test.setTimeout(60 * 1000);

/** Sidebar link for a chat, addressed by id so the test never depends on ordering. */
function chatLink(page: import('@playwright/test').Page, chatUrl: string) {
	const chatId = new URL(chatUrl).pathname.split('/').pop();
	return page.locator(`[data-testid="chat-list-item"][href="/chat/${chatId}"]`);
}

test.describe('S7-07: Chat Management', () => {
	test.beforeEach(async ({ page }) => {
		await setupTestState(page);
		await mockServerHealth(page);
		await mockChatGeneration(page);
	});

	test.describe('Create New Chat', () => {
		test('should open an empty composer on a new chat', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);

			await expect(page.getByTestId('message-input')).toHaveValue('');
			await expect(page.getByTestId('chat-message')).toHaveCount(0);
		});

		test('should persist the chat in the sidebar after the first message', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);

			await sendMessage(page, 'First message in chat 1', { waitForResponse: false });

			await expect(page.getByTestId('chat-list-item')).toHaveCount(1, { timeout: 10_000 });
			await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/, { timeout: 10_000 });
		});

		test('should clear the transcript when starting another chat', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);

			await sendMessage(page, 'First message in chat 1', { waitForResponse: false });
			await expect(page.getByTestId('chat-message').first()).toBeVisible();

			await createNewChat(page);

			await expect(page.getByTestId('chat-message')).toHaveCount(0);
			await expect(page.getByTestId('message-input')).toHaveValue('');
		});
	});

	test.describe('Assistant Response', () => {
		test('should render the streamed assistant reply', async ({ page }) => {
			await mockChatGeneration(page, { chunks: ['Mocked ', 'assistant ', 'reply.'] });

			await page.goto('/chat/new');
			await waitForChatReady(page);

			await sendMessage(page, 'Hello there');

			const assistant = page.locator('[data-testid="chat-message"][data-role="assistant"]');
			await expect(assistant).toHaveCount(1);
			await expect(assistant).toContainText('Mocked assistant reply.', { timeout: 15_000 });
		});
	});

	test.describe('Delete Chat', () => {
		test('should delete the open chat and leave the chat route', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);
			await sendMessage(page, 'Message to be deleted', { waitForResponse: false });
			await expect(page.getByTestId('chat-list-item')).toHaveCount(1, { timeout: 10_000 });

			await deleteCurrentChat(page);

			await expect(page.getByTestId('chat-list-item')).toHaveCount(0, { timeout: 10_000 });
		});

		test('should keep the chat when the confirmation is cancelled', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);
			await sendMessage(page, 'Message to keep', { waitForResponse: false });
			await expect(page.getByTestId('chat-list-item')).toHaveCount(1, { timeout: 10_000 });

			await deleteCurrentChat(page, { confirm: false });

			await expect(page.getByTestId('chat-list-item')).toHaveCount(1);
			await expect(page.getByText('Message to keep')).toBeVisible();
		});
	});

	test.describe('Switch Between Chats', () => {
		test('should switch between multiple chats', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);

			await sendMessage(page, 'Message in chat 1', { waitForResponse: false });
			await expect(page.getByTestId('chat-list-item')).toHaveCount(1, { timeout: 10_000 });
			const chatA = page.url();

			await createNewChat(page);
			await sendMessage(page, 'Message in chat 2', { waitForResponse: false });
			await expect(page.getByTestId('chat-list-item')).toHaveCount(2, { timeout: 10_000 });
			const chatB = page.url();

			await chatLink(page, chatA).click();
			await expect(page).toHaveURL(chatA);
			await expect(page.getByText('Message in chat 1')).toBeVisible({ timeout: 10_000 });
			await expect(page.getByText('Message in chat 2')).toBeHidden();

			await chatLink(page, chatB).click();
			await expect(page).toHaveURL(chatB);
			await expect(page.getByText('Message in chat 2')).toBeVisible({ timeout: 10_000 });
			await expect(page.getByText('Message in chat 1')).toBeHidden();
		});
	});

	test.describe('Message Persistence', () => {
		test('should preserve every message of a chat across switches', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);

			await sendMessage(page, 'Chat A - Message 1', { waitForResponse: false });
			await sendMessage(page, 'Chat A - Message 2', { waitForResponse: false });
			await expect(page.getByTestId('chat-list-item')).toHaveCount(1, { timeout: 10_000 });
			const chatA = page.url();

			await createNewChat(page);
			await sendMessage(page, 'Chat B - Message 1', { waitForResponse: false });
			await expect(page.getByTestId('chat-list-item')).toHaveCount(2, { timeout: 10_000 });
			const chatB = page.url();

			await chatLink(page, chatA).click();
			await expect(page.getByText('Chat A - Message 1')).toBeVisible({ timeout: 10_000 });
			await expect(page.getByText('Chat A - Message 2')).toBeVisible();
			await expect(page.getByText('Chat B - Message 1')).toBeHidden();

			await chatLink(page, chatB).click();
			await expect(page.getByText('Chat B - Message 1')).toBeVisible({ timeout: 10_000 });
			await expect(page.getByText('Chat A - Message 1')).toBeHidden();
			await expect(page.getByText('Chat A - Message 2')).toBeHidden();
		});
	});
});
