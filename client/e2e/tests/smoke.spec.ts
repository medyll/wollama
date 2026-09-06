/**
 * E2E Smoke Tests - Critical User Flows (S6-03)
 *
 * The four flows that must never break:
 * 1. Send a message and see the reply
 * 2. Start a new chat
 * 3. Reach settings
 * 4. List and toggle a hook
 *
 * This suite drives the UI against a stubbed backend. It deliberately does not
 * spawn the Node server — `skills.spec.ts` covers the real backend contract.
 */

import { test, expect } from '@playwright/test';
import {
	setupTestState,
	waitForChatReady,
	sendMessage,
	createNewChat,
	mockServerHealth,
	mockChatGeneration,
	mockHooks
} from '../fixtures/test-setup';

test.setTimeout(60 * 1000);

test.describe('S6-03: E2E Smoke Tests', () => {
	test.beforeEach(async ({ page }) => {
		await setupTestState(page);
		await mockServerHealth(page);
		await mockChatGeneration(page, { reply: 'Smoke test reply.' });
	});

	test.describe('Critical Flow 1: Send Message', () => {
		test('should send a message and receive a reply', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);

			await sendMessage(page, 'Hello, this is a smoke test!');

			await expect(page.getByText('Hello, this is a smoke test!')).toBeVisible();
			await expect(page.locator('[data-testid="chat-message"][data-role="assistant"]')).toContainText(
				'Smoke test reply.',
				{ timeout: 15_000 }
			);
		});
	});

	test.describe('Critical Flow 2: New Chat', () => {
		test('should start a new chat from the sidebar', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);
			await sendMessage(page, 'First conversation', { waitForResponse: false });
			await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/, { timeout: 10_000 });

			await createNewChat(page);

			await expect(page).toHaveURL(/\/chat\/new$/);
			await expect(page.getByTestId('chat-message')).toHaveCount(0);
		});
	});

	test.describe('Critical Flow 3: Settings', () => {
		test('should open settings from the sidebar', async ({ page }) => {
			await page.goto('/chat/new');
			await waitForChatReady(page);

			await page.locator('.sidebar-footer button', { hasText: /settings|paramètres/i }).click();

			await expect(page).toHaveURL(/\/settings$/, { timeout: 10_000 });
			await expect(page.getByRole('checkbox', { name: 'Toggle Hooks' })).toBeAttached();
		});
	});

	test.describe('Critical Flow 4: Hooks', () => {
		test('should list registered hooks and toggle one', async ({ page }) => {
			const toggles = await mockHooks(page, [
				{ _id: 'hook-1', name: 'Prompt enricher', event: 'pre_message', is_enabled: false, handler_type: 'builtin' }
			]);

			await page.goto('/settings');
			await page.getByRole('checkbox', { name: 'Toggle Hooks' }).check();

			await expect(page.getByText('Prompt enricher')).toBeVisible({ timeout: 10_000 });
			await expect(page.getByText('pre_message')).toBeVisible();

			const hookToggle = page.locator('table input[type="checkbox"]').first();
			await expect(hookToggle).not.toBeChecked();
			await hookToggle.check();

			await expect(hookToggle).toBeChecked();
			expect(toggles).toEqual([{ id: 'hook-1', is_enabled: true }]);
		});

		test('should report an empty hook registry', async ({ page }) => {
			await mockHooks(page, []);

			await page.goto('/settings');
			await page.getByRole('checkbox', { name: 'Toggle Hooks' }).check();

			await expect(page.getByText('No hooks registered.')).toBeVisible({ timeout: 10_000 });
		});
	});
});
