/**
 * E2E Tests - Companion Management (S7-07)
 *
 * Companion management lives on its own routes, not inside the chat selector:
 * - `/compagnons` lists system ("Default") and personal companions
 * - "Customize" forks a system companion via `/compagnons/customize?id=…&new=true`
 * - "Edit" updates a personal one via the same route with `new=false`
 * - "Chat" opens a new conversation bound to that companion
 *
 * Deleting a companion is not covered: the service supports it but no UI exposes
 * it. Add specs here when a delete control ships.
 */

import { test, expect } from '@playwright/test';
import { setupTestState, waitForChatReady, mockServerHealth, mockChatGeneration } from '../fixtures/test-setup';

test.setTimeout(60 * 1000);

/**
 * Opens the companion list the way a user reaches it: the app boots on the chat
 * route, which is where the default companions get seeded into the local database.
 * `/compagnons` reads them once on mount, so landing there on a cold profile would
 * race the seeding and show an empty list.
 */
async function openCompanions(page: import('@playwright/test').Page) {
	await page.goto('/chat/new');
	await waitForChatReady(page);
	await page.goto('/compagnons');
}

/** Fills the companion editor and saves it. */
async function fillEditor(page: import('@playwright/test').Page, values: { name: string; prompt: string; description?: string }) {
	await page.getByLabel('Companion name').fill(values.name);
	await page.getByLabel('System prompt').fill(values.prompt);
	if (values.description) {
		await page.getByLabel('Companion description').fill(values.description);
	}
	// The model is required and the list comes from Ollama; take whatever is offered.
	const modelSelect = page.getByLabel('AI model');
	const firstModel = await modelSelect.locator('option:not([value=""])').first().getAttribute('value');
	await modelSelect.selectOption(firstModel!);
}

test.describe('S7-07: Companion Management', () => {
	test.beforeEach(async ({ page }) => {
		await setupTestState(page);
		await mockServerHealth(page);
		await mockChatGeneration(page);
	});

	test.describe('Companion List', () => {
		test('should list the seeded system companions', async ({ page }) => {
			await openCompanions(page);

			const cards = page.locator('companion-card');
			await expect(cards.first()).toBeVisible({ timeout: 15_000 });
			expect(await cards.count()).toBeGreaterThan(0);
		});

		test('should mark seeded companions as Default and offer Customize', async ({ page }) => {
			await openCompanions(page);

			const firstCard = page.locator('companion-card').first();
			await expect(firstCard).toBeVisible({ timeout: 15_000 });
			await expect(firstCard.locator('[data-kind="default"]')).toHaveText('Default');
			await expect(firstCard.getByRole('button', { name: /^Customize / })).toBeVisible();
			await expect(firstCard.getByRole('button', { name: /^Edit / })).toHaveCount(0);
		});
	});

	test.describe('Create New Companion', () => {
		test('should fork a system companion into a personal one', async ({ page }) => {
			await openCompanions(page);

			const firstCard = page.locator('companion-card').first();
			await expect(firstCard).toBeVisible({ timeout: 15_000 });
			await firstCard.getByRole('button', { name: /^Customize / }).click();

			await expect(page).toHaveURL(/\/compagnons\/customize\?id=.+&new=true$/);
			await expect(page.getByRole('heading', { level: 1, name: 'Customize Companion' })).toBeVisible();

			await fillEditor(page, {
				name: 'Test Companion',
				prompt: 'You are a test companion for E2E testing.',
				description: 'Created by the E2E suite'
			});
			await page.getByRole('button', { name: /create companion/i }).click();

			await expect(page).toHaveURL(/\/compagnons$/, { timeout: 15_000 });
			await expect(page.locator('companion-card').filter({ hasText: 'Test Companion' })).toBeVisible({
				timeout: 15_000
			});
		});

		test('should refuse to save an incomplete companion', async ({ page }) => {
			await openCompanions(page);

			const firstCard = page.locator('companion-card').first();
			await expect(firstCard).toBeVisible({ timeout: 15_000 });
			await firstCard.getByRole('button', { name: /^Customize / }).click();

			await page.getByRole('button', { name: /create companion/i }).click();

			await expect(page.getByText('Name is required')).toBeVisible();
			await expect(page.getByText('System prompt is required')).toBeVisible();
			await expect(page).toHaveURL(/\/compagnons\/customize/);
		});
	});

	test.describe('Edit Companion', () => {
		/** Creates a personal companion and returns to the list. */
		async function createPersonalCompanion(page: import('@playwright/test').Page, name: string) {
			await openCompanions(page);
			const firstCard = page.locator('companion-card').first();
			await expect(firstCard).toBeVisible({ timeout: 15_000 });
			await firstCard.getByRole('button', { name: /^Customize / }).click();
			await fillEditor(page, { name, prompt: 'Original prompt for E2E testing.' });
			await page.getByRole('button', { name: /create companion/i }).click();
			await expect(page.locator('companion-card').filter({ hasText: name })).toBeVisible({ timeout: 15_000 });
		}

		test('should rename a personal companion', async ({ page }) => {
			await createPersonalCompanion(page, 'Renamable Companion');

			const card = page.locator('companion-card').filter({ hasText: 'Renamable Companion' });
			await card.getByRole('button', { name: /^Edit / }).click();

			await expect(page).toHaveURL(/\/compagnons\/customize\?id=.+&new=false$/);
			await expect(page.getByLabel('Companion name')).toHaveValue('Renamable Companion', { timeout: 15_000 });

			await page.getByLabel('Companion name').fill('Renamed Companion');
			await page.getByRole('button', { name: /save changes/i }).click();

			await expect(page.locator('companion-card').filter({ hasText: 'Renamed Companion' })).toBeVisible({
				timeout: 15_000
			});
			await expect(page.locator('companion-card').filter({ hasText: 'Renamable Companion' })).toHaveCount(0);
		});

		test('should update the system prompt and keep it after a reload', async ({ page }) => {
			await createPersonalCompanion(page, 'Prompt Companion');

			const card = page.locator('companion-card').filter({ hasText: 'Prompt Companion' });
			await card.getByRole('button', { name: /^Edit / }).click();
			await expect(page.getByLabel('System prompt')).toHaveValue('Original prompt for E2E testing.', {
				timeout: 15_000
			});

			await page.getByLabel('System prompt').fill('Updated prompt for E2E testing.');
			await page.getByRole('button', { name: /save changes/i }).click();
			await expect(page).toHaveURL(/\/compagnons$/, { timeout: 15_000 });

			await page.reload();
			await page
				.locator('companion-card')
				.filter({ hasText: 'Prompt Companion' })
				.getByRole('button', { name: /^Edit / })
				.click();

			await expect(page.getByLabel('System prompt')).toHaveValue('Updated prompt for E2E testing.', {
				timeout: 15_000
			});
		});

		test('should leave the companion untouched when editing is cancelled', async ({ page }) => {
			await createPersonalCompanion(page, 'Cancelled Companion');

			await page
				.locator('companion-card')
				.filter({ hasText: 'Cancelled Companion' })
				.getByRole('button', { name: /^Edit / })
				.click();
			await expect(page.getByLabel('Companion name')).toHaveValue('Cancelled Companion', { timeout: 15_000 });

			await page.getByLabel('Companion name').fill('Should Not Persist');
			await page.getByRole('button', { name: 'Cancel editing' }).click();

			await expect(page).toHaveURL(/\/compagnons$/, { timeout: 15_000 });
			await expect(page.locator('companion-card').filter({ hasText: 'Cancelled Companion' })).toBeVisible();
			await expect(page.locator('companion-card').filter({ hasText: 'Should Not Persist' })).toHaveCount(0);
		});
	});

	test.describe('Use a Companion', () => {
		test('should start a chat bound to the chosen companion', async ({ page }) => {
			await openCompanions(page);

			const firstCard = page.locator('companion-card').first();
			await expect(firstCard).toBeVisible({ timeout: 15_000 });
			const companionName = (await firstCard.locator('h2').textContent())?.trim() ?? '';

			await firstCard.getByRole('button', { name: /^Chat with / }).click();

			await expect(page).toHaveURL(/\/chat\/new$/, { timeout: 15_000 });
			await waitForChatReady(page);
			await expect(page.locator('button.companion-control')).toContainText(companionName, {
				timeout: 15_000
			});
		});

		test('should keep the companion on the chat it created', async ({ page }) => {
			await openCompanions(page);

			const firstCard = page.locator('companion-card').first();
			await expect(firstCard).toBeVisible({ timeout: 15_000 });
			const companionName = (await firstCard.locator('h2').textContent())?.trim() ?? '';
			await firstCard.getByRole('button', { name: /^Chat with / }).click();
			await waitForChatReady(page);

			const input = page.getByTestId('message-input');
			await input.fill('Hello companion');
			await input.press('Enter');
			await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/, { timeout: 15_000 });

			await page.reload();
			await waitForChatReady(page);

			await expect(page.locator('button.companion-control')).toContainText(companionName, {
				timeout: 15_000
			});
		});
	});
});
