/**
 * Simple E2E Tests for Onboarding Journey
 *
 * Basic tests to verify:
 * 1. App loads successfully
 * 2. Onboarding wizard appears for new users
 * 3. Can navigate through onboarding steps
 * 4. Ollama connection test is automatic
 */

import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5176'; // Vite dev server port

test.describe('Onboarding - Basic Flow', () => {
	test('app should load and show onboarding wizard', async ({ page }) => {
		await page.goto(APP_URL);
		await page.waitForLoadState('networkidle');

		// Wait for onboarding wizard to appear
		const wizard = page.locator('[data-testid="onboarding-wizard"]');
		await expect(wizard).toBeVisible({ timeout: 10000 });
	});

	test('onboarding wizard should have correct title', async ({ page }) => {
		await page.goto(APP_URL);
		await page.waitForLoadState('networkidle');

		const wizardTitle = page.locator('[data-testid="wizard-title"]');
		await expect(wizardTitle).toBeVisible();

		const titleText = await wizardTitle.textContent();
		expect(titleText).toBeTruthy();
		expect(titleText?.length).toBeGreaterThan(0);
	});

	test('onboarding wizard should have navigation buttons', async ({ page }) => {
		await page.goto(APP_URL);
		await page.waitForLoadState('networkidle');

		const nextButton = page.locator('[data-testid="wizard-next-button"]');
		await expect(nextButton).toBeVisible();

		const skipButton = page.locator('[data-testid="wizard-skip-button"]');
		await expect(skipButton).toBeVisible();
	});

	test('should test Ollama connection automatically', async ({ page }) => {
		await page.goto(APP_URL);
		await page.waitForLoadState('networkidle');

		// Fill in profile
		await page.locator('#nickname').click();
		await page.locator('#nickname').type('TestUser');
		await page.waitForTimeout(500);
		await page.locator('[data-testid="wizard-next-button"]').click();
		
		// Wait for auto connection test
		await page.waitForTimeout(8000);

		// Connection test should have run (message should appear)
		const connectionMessage = page.locator('[data-testid="connection-success"], [data-testid="connection-error"]');
		await expect(connectionMessage).toBeVisible({ timeout: 10000 });
	});
});
