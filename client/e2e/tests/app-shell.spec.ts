import { expect, test } from '@playwright/test';
import { setupTestState } from '../fixtures/test-setup';

test.describe('Configured application shell', () => {
	test.beforeEach(async ({ page }) => {
		await setupTestState(page);
	});

	test('opens the chat landing page without returning to onboarding', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveURL(/\/chat$/);
		await expect(page.getByRole('dialog', { name: 'Wollama' })).toBeHidden({ timeout: 10_000 });
		await expect(page.getByRole('heading', { name: /ready/i })).toBeVisible();
		await expect(page.getByTestId('chat-list')).toHaveCount(1);
		await expect(page.getByTestId('onboarding-wizard')).toHaveCount(0);
	});

	test('opens a new conversation from the chat landing page', async ({ page }) => {
		await page.goto('/chat');
		await expect(page.getByRole('dialog', { name: 'Wollama' })).toBeHidden({ timeout: 10_000 });
		await page
			.locator('.hero')
			.getByRole('button', { name: /new chat/i })
			.click();

		await expect(page).toHaveURL(/\/chat\/new$/);
		await expect(page.getByTestId('message-input')).toBeVisible({ timeout: 10_000 });
	});
});
