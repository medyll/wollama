/**
 * E2E Multi-Device Sync (S5-04)
 *
 * Proves that one piece of data written on device A reaches device B through the
 * real path: RxDB replicateCouchDB -> the server's express-pouchdb mount at
 * `/_db/user_<uid>_<table>`. Both devices are separate browser contexts (separate
 * IndexedDB) signed in as the same user, talking to a server started for this
 * suite on its own temporary database.
 *
 * Single-device UX is covered elsewhere; this file only validates cross-device
 * replication.
 */

import { test, expect, type Page } from '@playwright/test';
import { startE2EServer, type E2EServer } from '../fixtures/e2e-server';
import { setupTestState, waitForChatReady } from '../fixtures/test-setup';

const SERVER_PORT = 3003;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;
const SYNC_UID = 'sync-e2e-user';

test.setTimeout(180 * 1000);

let server: E2EServer | null = null;

async function waitForServer(request: any, timeout = 120_000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		try {
			const res = await request.get(`${SERVER_URL}/api/health`);
			if (res.ok()) return;
		} catch {
			// not up yet
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	throw new Error('Server did not become ready in time');
}

/** Opens the companion list on a device, seeding the local database on the way. */
async function openCompanions(page: Page) {
	await setupTestState(page, { uid: SYNC_UID, serverUrl: SERVER_URL });
	await page.goto('/chat/new');
	await waitForChatReady(page);
	await page.goto('/compagnons');
	await expect(page.locator('companion-card').first()).toBeVisible({ timeout: 30_000 });
}

test.beforeAll(() => {
	server = startE2EServer({ port: SERVER_PORT, databasePrefix: 'wollama-sync-e2e' });
	server.process.stderr?.on('data', (d) => console.error('[server]', d.toString()));
});

test.afterAll(async () => {
	await server?.stop();
});

test.describe('Multi-Device Sync Smoke', () => {
	test('a companion created on device A appears on device B', async ({ browser, request }) => {
		await waitForServer(request);

		const contextA = await browser.newContext();
		const contextB = await browser.newContext();

		try {
			const deviceA = await contextA.newPage();
			const deviceB = await contextB.newPage();

			await openCompanions(deviceA);

			// Device A forks a system companion into a personal one.
			const companionName = `Sync Smoke ${Date.now()}`;
			await deviceA
				.locator('companion-card')
				.first()
				.getByRole('button', { name: /^Customize / })
				.click();
			await deviceA.getByLabel('Companion name').fill(companionName);
			await deviceA.getByLabel('System prompt').fill('Minimal smoke prompt for replication.');
			const modelSelect = deviceA.getByLabel('AI model');
			const firstModel = await modelSelect.locator('option:not([value=""])').first().getAttribute('value');
			await modelSelect.selectOption(firstModel!);
			await deviceA.getByRole('button', { name: /create companion/i }).click();

			await expect(deviceA.locator('companion-card').filter({ hasText: companionName })).toBeVisible({
				timeout: 30_000
			});

			// Device B starts cold and must pull it down.
			await openCompanions(deviceB);

			// `/compagnons` reads once on mount, so re-enter the route while polling.
			await expect
				.poll(
					async () => {
						await deviceB.goto('/compagnons');
						return deviceB.locator('companion-card').filter({ hasText: companionName }).count();
					},
					{ timeout: 60_000, intervals: [2_000] }
				)
				.toBeGreaterThan(0);
		} finally {
			await contextA.close();
			await contextB.close();
		}
	});
});
