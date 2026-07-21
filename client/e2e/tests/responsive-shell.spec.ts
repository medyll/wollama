import { expect, test } from '@playwright/test';
import { setupTestState } from '../fixtures/test-setup';

const viewports = [
	{ name: 'mobile', width: 375, height: 667 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'laptop', width: 1366, height: 768 },
	{ name: 'desktop', width: 1920, height: 1080 }
];

for (const viewport of viewports) {
	test(`chat shell fits the ${viewport.name} viewport`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await setupTestState(page);
		await page.goto('/chat/new');

		await expect(page.getByTestId('message-input')).toBeVisible({ timeout: 10_000 });

		const geometry = await page.evaluate(() => ({
			documentWidth: document.documentElement.scrollWidth,
			viewportWidth: document.documentElement.clientWidth,
			documentHeight: document.documentElement.scrollHeight,
			viewportHeight: document.documentElement.clientHeight
		}));

		expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
		expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewportHeight);
	});
}

test('onboarding remains usable in a short mobile viewport', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 600 });
	await page.goto('/onboarding');

	const wizard = page.getByTestId('onboarding-wizard');
	await expect(wizard).toBeVisible();
	await expect(page.getByTestId('wizard-next-button')).toBeVisible();

	const box = await wizard.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.width).toBeLessThanOrEqual(375);
	expect(box!.height).toBeLessThanOrEqual(600);
});
