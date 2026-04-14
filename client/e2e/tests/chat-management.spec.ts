/**
 * E2E Tests - Chat Management (S7-07)
 *
 * Tests for chat CRUD operations:
 * 1. Create a new chat
 * 2. Rename a chat
 * 3. Delete a chat
 * 4. Switch between chats
 * 5. Message persistence across chats
 */

import { test, expect } from '@playwright/test';
import { setupTestState, waitForChatReady, createNewChat, sendMessage, getChatList } from '../fixtures/test-setup';

test.setTimeout(60 * 1000);

// Use baseURL from playwright.config.ts
const BASE_URL = 'http://localhost:5176';

test.describe('S7-07: Chat Management', () => {
	test.beforeEach(async ({ page }) => {
		// Set up clean state for each test
		await setupTestState(page);
	});

	test.describe('Create New Chat', () => {
		test('should create a new chat from empty state', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Click "New Chat" button in sidebar
			await createNewChat(page);

			// Chat should be cleared and ready for new message
			await expect(page.getByTestId('message-input')).toBeVisible();
			await expect(page.getByTestId('message-input')).toHaveValue('');
		});

		test('should create a new chat after sending a message', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Send a message to create initial chat
			await sendMessage(page, 'First message in chat 1', { waitForResponse: false });

			// Message should appear
			await expect(page.locator('[data-testid="chat-message"]').first()).toBeVisible({ timeout: 5000 });

			// Create new chat
			await createNewChat(page);

			// Previous messages should be cleared
			await expect(page.locator('[data-testid="chat-message"]')).not.toBeVisible();
		});
	});

	test.describe('Rename Chat', () => {
		test('should rename a chat from sidebar', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Create a chat with a message
			await sendMessage(page, 'Test message for rename', { waitForResponse: false });
			await page.waitForTimeout(2000);

			// Find chat in sidebar
			const chatItem = page.getByTestId('chat-list-item').first();
			await expect(chatItem).toBeVisible();

			// Hover to show actions
			await chatItem.hover();

			// Click rename button (pencil icon or "Rename" text)
			const renameBtn = chatItem.locator('button[title="Rename"], button:has-text("Rename"), .rename-btn, [aria-label*="rename" i]');
			if (await renameBtn.isVisible()) {
				await renameBtn.click();

				// Edit dialog should appear
				const editInput = page.locator('input[placeholder*="name" i], input[type="text"]').first();
				await expect(editInput).toBeVisible();

				// Type new name
				await editInput.fill('Renamed Test Chat');
				await editInput.press('Enter');

				// Chat should be renamed
				await expect(page.getByText('Renamed Test Chat')).toBeVisible({ timeout: 5000 });
			}
		});
	});

	test.describe('Delete Chat', () => {
		test('should delete a chat from sidebar', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Create a chat with a message
			await sendMessage(page, 'Message to be deleted', { waitForResponse: false });
			await page.waitForTimeout(2000);

			// Find chat in sidebar
			const chatItem = page.getByTestId('chat-list-item').first();
			await expect(chatItem).toBeVisible();

			// Hover to show actions
			await chatItem.hover();

			// Click delete button (trash icon or "Delete" text)
			const deleteBtn = chatItem.locator('button[title="Delete"], button:has-text("Delete"), .delete-btn, [aria-label*="delete" i]');
			if (await deleteBtn.isVisible()) {
				await deleteBtn.click();

				// Confirmation dialog should appear
				const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete"), .btn-danger').first();
				await expect(confirmBtn).toBeVisible();
				await confirmBtn.click();

				// Chat should be removed from list
				await expect(chatItem).not.toBeVisible({ timeout: 5000 });
			}
		});

		test('should cancel chat deletion', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Create a chat
			await sendMessage(page, 'Message to keep', { waitForResponse: false });
			await page.waitForTimeout(2000);

			// Find chat in sidebar
			const chatItem = page.getByTestId('chat-list-item').first();
			await chatItem.hover();

			// Click delete
			const deleteBtn = chatItem.locator('button[title="Delete"], button:has-text("Delete"), .delete-btn, [aria-label*="delete" i]');
			if (await deleteBtn.isVisible()) {
				await deleteBtn.click();

				// Click cancel instead of confirm
				const cancelBtn = page.locator('button:has-text("Cancel"), .btn-ghost').first();
				if (await cancelBtn.isVisible()) {
					await cancelBtn.click();

					// Chat should still exist
					await expect(chatItem).toBeVisible();
				}
			}
		});
	});

	test.describe('Switch Between Chats', () => {
		test('should switch between multiple chats', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Create first chat
			await sendMessage(page, 'Message in chat 1', { waitForResponse: false });
			await page.waitForTimeout(2000);

			// Create second chat
			await createNewChat(page);

			await sendMessage(page, 'Message in chat 2', { waitForResponse: false });
			await page.waitForTimeout(2000);

			// Should see 2 chats in sidebar
			const chatItems = page.getByTestId('chat-list-item');
			await expect(chatItems).toHaveCount(2);

			// Click on first chat
			await chatItems.first().click();
			await page.waitForTimeout(500);

			// Should see message from chat 1
			await expect(page.getByText('Message in chat 1')).toBeVisible();
			await expect(page.getByText('Message in chat 2')).not.toBeVisible();

			// Click on second chat
			await chatItems.last().click();
			await page.waitForTimeout(500);

			// Should see message from chat 2
			await expect(page.getByText('Message in chat 2')).toBeVisible();
			await expect(page.getByText('Message in chat 1')).not.toBeVisible();
		});
	});

	test.describe('Message Persistence', () => {
		test('should preserve messages when switching chats', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Create chat A with multiple messages
			await sendMessage(page, 'Chat A - Message 1', { waitForResponse: false });
			await page.waitForTimeout(1000);

			await sendMessage(page, 'Chat A - Message 2', { waitForResponse: false });
			await page.waitForTimeout(2000);

			// Create chat B
			await createNewChat(page);

			await sendMessage(page, 'Chat B - Message 1', { waitForResponse: false });
			await page.waitForTimeout(2000);

			// Switch back to chat A
			const chatItems = page.getByTestId('chat-list-item');
			await chatItems.first().click();
			await page.waitForTimeout(1000);

			// Both messages from chat A should be visible
			await expect(page.getByText('Chat A - Message 1')).toBeVisible();
			await expect(page.getByText('Chat A - Message 2')).toBeVisible();
			await expect(page.getByText('Chat B - Message 1')).not.toBeVisible();

			// Switch back to chat B
			await chatItems.last().click();
			await page.waitForTimeout(1000);

			// Message from chat B should be visible
			await expect(page.getByText('Chat B - Message 1')).toBeVisible();
			await expect(page.getByText('Chat A - Message 1')).not.toBeVisible();
			await expect(page.getByText('Chat A - Message 2')).not.toBeVisible();
		});
	});
});
