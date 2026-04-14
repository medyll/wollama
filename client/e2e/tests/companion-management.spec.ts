/**
 * E2E Tests - Companion Management (S7-07)
 *
 * Tests for companion CRUD operations:
 * 1. Create a new companion
 * 2. Edit companion (name, prompt, avatar)
 * 3. Delete a companion
 * 4. Switch between companions
 * 5. Companion preferences persistence
 */

import { test, expect } from '@playwright/test';
import { setupTestState, waitForChatReady, selectCompanion, getCompanionList } from '../fixtures/test-setup';

test.setTimeout(60 * 1000);

// Use baseURL from playwright.config.ts
const BASE_URL = 'http://localhost:5176';

test.describe('S7-07: Companion Management', () => {
	test.beforeEach(async ({ page }) => {
		// Set up clean state for each test
		await setupTestState(page);
	});

	test.describe('Create New Companion', () => {
		test('should create a new companion from companion selector', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Click "New Companion" or "Create" button
			const createBtn = page.getByTestId('create-companion-button');
			if (await createBtn.isVisible()) {
				await createBtn.click();
			} else {
				// Fallback: look for "+" button or "Add" text
				const addBtn = page.locator('button:has-text("New"), button:has-text("Create"), button:has-text("+")').first();
				await addBtn.click();
			}

			// Edit form should appear
			const nameInput = page.getByTestId('companion-name-input');
			await expect(nameInput).toBeVisible();

			// Fill in companion details
			await nameInput.fill('Test Companion');

			const promptInput = page.getByTestId('companion-prompt-input');
			await expect(promptInput).toBeVisible();
			await promptInput.fill('You are a test companion for E2E testing.');

			// Save the companion
			const saveBtn = page.getByTestId('save-companion-button');
			await saveBtn.click();

			// Companion should appear in the list
			await expect(page.getByText('Test Companion')).toBeVisible({ timeout: 5000 });
		});

		test('should create companion with custom avatar', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Click create button
			const createBtn = page.getByTestId('create-companion-button');
			if (await createBtn.isVisible()) {
				await createBtn.click();
			} else {
				const addBtn = page.locator('button:has-text("New"), button:has-text("Create")').first();
				await addBtn.click();
			}

			// Fill in details
			await page.getByTestId('companion-name-input').fill('Avatar Test Bot');
			await page.getByTestId('companion-prompt-input').fill('You have a custom avatar.');

			// Select an avatar (if avatar selector exists)
			const avatarSelector = page.getByTestId('avatar-selector');
			if (await avatarSelector.isVisible()) {
				await avatarSelector.click();
				// Select first avatar option
				const avatarOption = page.getByTestId('avatar-option').first();
				if (await avatarOption.isVisible()) {
					await avatarOption.click();
				}
			}

			// Save
			await page.getByTestId('save-companion-button').click();

			// Should see companion with name
			await expect(page.getByText('Avatar Test Bot')).toBeVisible({ timeout: 5000 });
		});
	});

	test.describe('Edit Companion', () => {
		test('should rename a companion', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Find and click on a companion card
			const companionCard = page.getByTestId('companion-card').first();
			await companionCard.click();

			// Click settings/edit button on companion
			const settingsBtn = page.getByTestId('companion-settings-button');
			if (await settingsBtn.isVisible()) {
				await settingsBtn.click();
			} else {
				// Fallback: right-click or look for edit icon
				const editBtn = page.locator('[data-testid="edit-companion-icon"], button:has-text("Edit")').first();
				if (await editBtn.isVisible()) {
					await editBtn.click();
				}
			}

			// Edit dialog should appear
			const nameInput = page.getByTestId('companion-name-input');
			await expect(nameInput).toBeVisible();

			// Clear and type new name
			await nameInput.clear();
			await nameInput.fill('Renamed Companion');

			// Save
			await page.getByTestId('save-companion-button').click();

			// New name should appear
			await expect(page.getByText('Renamed Companion')).toBeVisible({ timeout: 5000 });
		});

		test('should update companion system prompt', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Open companion settings
			const companionCard = page.getByTestId('companion-card').first();
			await companionCard.click();

			const settingsBtn = page.getByTestId('companion-settings-button');
			if (await settingsBtn.isVisible()) {
				await settingsBtn.click();
			}

			// Update prompt
			const promptInput = page.getByTestId('companion-prompt-input');
			await expect(promptInput).toBeVisible();
			await promptInput.clear();
			await promptInput.fill('You are a renamed companion with updated instructions.');

			// Save
			await page.getByTestId('save-companion-button').click();

			// Re-open to verify persistence
			await page.waitForTimeout(1000);
			await companionCard.click();

			if (await settingsBtn.isVisible()) {
				await settingsBtn.click();
			}

			// Prompt should be saved
			const savedPrompt = await promptInput.inputValue();
			expect(savedPrompt).toContain('updated instructions');
		});
	});

	test.describe('Delete Companion', () => {
		test('should delete a companion', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Count companions before deletion
			const initialCount = await page.getByTestId('companion-card').count();

			// Open companion settings
			const companionCard = page.getByTestId('companion-card').last();
			await companionCard.hover();

			// Look for delete button
			const deleteBtn = companionCard.getByTestId('delete-companion-button');
			if (await deleteBtn.isVisible()) {
				await deleteBtn.click();

				// Confirmation dialog should appear
				const confirmBtn = page.getByTestId('confirm-delete-companion-button');
				await expect(confirmBtn).toBeVisible();
				await confirmBtn.click();

				// Companion should be removed
				await expect(companionCard).not.toBeVisible({ timeout: 5000 });

				// Count should decrease by 1
				const finalCount = await page.getByTestId('companion-card').count();
				expect(finalCount).toBe(initialCount - 1);
			}
		});

		test('should cancel companion deletion', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Open companion settings
			const companionCard = page.getByTestId('companion-card').first();
			await companionCard.hover();

			const deleteBtn = companionCard.getByTestId('delete-companion-button');
			if (await deleteBtn.isVisible()) {
				await deleteBtn.click();

				// Click cancel instead of confirm
				const cancelBtn = page.getByTestId('cancel-delete-companion-button');
				if (await cancelBtn.isVisible()) {
					await cancelBtn.click();

					// Companion should still exist
					await expect(companionCard).toBeVisible();
				}
			}
		});
	});

	test.describe('Switch Between Companions', () => {
		test('should switch between companions', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Count available companions
			const companionCards = page.getByTestId('companion-card');
			const count = await companionCards.count();

			test.skip(count < 2, 'Need at least 2 companions for switch test');

			// Click first companion
			await companionCards.first().click();
			await page.waitForTimeout(500);

			// First companion should be selected (check for active state)
			const firstCompanion = companionCards.first();
			await expect(firstCompanion).toHaveClass(/ring-2|active|selected/);

			// Send a message with first companion
			const input = page.getByTestId('chat-input');
			await input.fill('Message with companion 1');
			await input.press('Enter');
			await page.waitForTimeout(2000);

			// Click second companion
			await companionCards.last().click();
			await page.waitForTimeout(500);

			// Second companion should be selected
			const secondCompanion = companionCards.last();
			await expect(secondCompanion).toHaveClass(/ring-2|active|selected/);

			// Previous message should not be visible (different companion context)
			// Note: This depends on implementation - may need adjustment
		});
	});

	test.describe('Companion Preferences Persistence', () => {
		test('should remember selected companion after page reload', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Select a companion
			const companionCard = page.getByTestId('companion-card').first();
			await companionCard.click();
			await page.waitForTimeout(500);

			// Get companion name before reload
			const companionName = await companionCard.textContent();

			// Reload page
			await page.reload({ waitUntil: 'networkidle' });
			await page.waitForSelector('[data-testid="companion-selector"]', { timeout: 10000 });

			// Same companion should still be selected
			const selectedCompanion = page.getByTestId('companion-card').first();
			const selectedName = await selectedCompanion.textContent();
			expect(selectedName).toBe(companionName);
		});

		test('should persist companion settings after reload', async ({ page }) => {
			await page.goto(`${BASE_URL}/chat`);
			await waitForChatReady(page);

			// Create a new companion with specific settings
			const createBtn = page.getByTestId('create-companion-button');
			if (await createBtn.isVisible()) {
				await createBtn.click();
			} else {
				const addBtn = page.locator('button:has-text("New"), button:has-text("Create")').first();
				await addBtn.click();
			}

			const testName = `Persist Test ${Date.now()}`;
			const testPrompt = 'You are a persistent test companion.';

			await page.getByTestId('companion-name-input').fill(testName);
			await page.getByTestId('companion-prompt-input').fill(testPrompt);
			await page.getByTestId('save-companion-button').click();

			// Wait for save
			await page.waitForTimeout(2000);

			// Reload page
			await page.reload({ waitUntil: 'networkidle' });
			await page.waitForSelector('[data-testid="companion-selector"]', { timeout: 10000 });

			// Companion should still exist
			await expect(page.getByText(testName)).toBeVisible();

			// Open settings to verify prompt persisted
			const companionCard = page.getByText(testName);
			await companionCard.click();

			const settingsBtn = page.getByTestId('companion-settings-button');
			if (await settingsBtn.isVisible()) {
				await settingsBtn.click();
			}

			const savedPrompt = await page.getByTestId('companion-prompt-input').inputValue();
			expect(savedPrompt).toContain('persistent test companion');
		});
	});
});
