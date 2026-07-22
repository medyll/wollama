import { expect, test } from '@playwright/test';
import { setupTestState } from '../fixtures/test-setup';

const viewports = [
	{ name: 'mobile', width: 360, height: 640 },
	{ name: 'desktop', width: 1440, height: 900 }
];

for (const viewport of viewports) {
	test(`settings sections remain usable on ${viewport.name}`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await setupTestState(page);
		await page.goto('/settings');

		await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
		await expect(page.locator('#nickname')).toBeVisible();
		await page.getByLabel('Toggle Authentication').click();
		await expect(page.getByText('Secure with password (shared machine)')).toBeVisible();

		const dimensions = await page.evaluate(() => ({
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth
		}));
		expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
	});
}
