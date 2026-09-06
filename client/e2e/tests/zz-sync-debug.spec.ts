import { test, expect } from '@playwright/test';
import { startE2EServer, type E2EServer } from '../fixtures/e2e-server';
import { setupTestState, waitForChatReady } from '../fixtures/test-setup';

const PORT = 3004;
const SERVER_URL = `http://127.0.0.1:${PORT}`;
const UID = 'sync-dbg-user';
let server: E2EServer | null = null;
test.setTimeout(180000);

test.beforeAll(() => {
	server = startE2EServer({ port: PORT, databasePrefix: 'wollama-dbg' });
});
test.afterAll(async () => {
	await server?.stop();
});

test('debug sync', async ({ browser, request }) => {
	const start = Date.now();
	while (Date.now() - start < 60000) {
		try {
			const r = await request.get(`${SERVER_URL}/api/health`);
			if (r.ok()) break;
		} catch {
			// Server startup is still in progress.
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	page.on('console', (m) => {
		const t = m.text();
		if (t.includes('eplicat') || m.type() === 'error') console.log('C', m.type(), t.slice(0, 200));
	});
	await setupTestState(page, { uid: UID, serverUrl: SERVER_URL });
	await page.goto('/');
	const probe = await page.evaluate(async (url) => {
		try {
			const r = await fetch(url + '/api/health');
			return 'health ' + r.status;
		} catch (e) {
			return 'health ERR ' + String(e);
		}
	}, SERVER_URL);
	console.log('PROBE', probe);
	const probePut = await page.evaluate(async (url) => {
		try {
			const r = await fetch(url + '/_db/probe_db', { method: 'PUT' });
			return 'put ' + r.status;
		} catch (e) {
			return 'put ERR ' + String(e);
		}
	}, SERVER_URL);
	console.log('PROBE2', probePut);
	await page.goto('/chat/new');
	await waitForChatReady(page);
	await page.goto('/compagnons');
	await expect(page.locator('companion-card').first()).toBeVisible({ timeout: 30000 });
	await page
		.locator('companion-card')
		.first()
		.getByRole('button', { name: /^Customize / })
		.click();
	await page.getByLabel('Companion name').fill('DbgCompanion');
	await page.getByLabel('System prompt').fill('Debug prompt for replication test.');
	const sel = page.getByLabel('AI model');
	await sel.selectOption((await sel.locator('option:not([value=""])').first().getAttribute('value'))!);
	await page.getByRole('button', { name: /create companion/i }).click();
	await expect(page.locator('companion-card').filter({ hasText: 'DbgCompanion' })).toBeVisible({ timeout: 30000 });
	await page.waitForTimeout(6000);
	for (const db of [`user_${UID}_user_companions`, `user_${UID}_chats`]) {
		const r = await request.get(`${SERVER_URL}/_db/${db}/_all_docs`);
		console.log('DB', db, r.status(), (await r.text()).slice(0, 300));
	}
	await ctx.close();
});
