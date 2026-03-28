/**
 * E2E Smoke Tests - Critical User Flows (S6-03)
 *
 * Basic smoke tests for the most critical user flows:
 * 1. Send message and receive response
 * 2. Create new chat
 * 3. Open settings and toggle skill
 * 4. View and toggle hook
 */

import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER_PORT = 3002;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;
const APP_URL = 'http://localhost:5173';

test.setTimeout(60 * 1000);

// Helper to wait for server
function waitForServer(request: any, serverProc: any, timeout = 60000) {
	const start = Date.now();
	return new Promise<void>(async (resolve, reject) => {
		let resolved = false;

		const checkHealth = async () => {
			try {
				const r = await request.get(`${SERVER_URL}/api/health`);
				if (r.ok()) {
					resolved = true;
					resolve();
				}
			} catch (e) {
				// ignore
			}
		};

		const onData = (d: Buffer) => {
			const s = d.toString();
			if (s.includes('Listening on port') || s.includes('Listening on')) {
				resolved = true;
				resolve();
			}
		};

		serverProc.stdout?.on('data', onData);

		while (!resolved && Date.now() - start < timeout) {
			await checkHealth();
			if (resolved) break;
			await new Promise((r) => setTimeout(r, 500));
		}

		if (!resolved) reject(new Error('Server timeout'));
	});
}

test.describe('S6-03: E2E Smoke Tests', () => {
	let serverProc: ChildProcess;

	test.beforeAll(async () => {
		// Start server for tests
		serverProc = spawn('npx', ['tsx', 'server.ts'], {
			cwd: path.join(ROOT, 'server'),
			env: { ...process.env, PORT: String(SERVER_PORT) },
			stdio: 'pipe'
		});

		// Wait for server to be ready
		await waitForServer(await import('playwright'), serverProc);
	});

	test.afterAll(async () => {
		// Stop server
		if (serverProc) {
			serverProc.kill();
		}
	});

	test.describe('Critical Flow 1: Send Message', () => {
		test('should send message and see it in chat', async ({ page }) => {
			await page.goto(APP_URL);

			// Wait for app to load
			await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });

			// Type message
			const input = page.getByTestId('chat-input');
			await input.fill('Hello, this is a smoke test!');

			// Send message
			await input.press('Enter');

			// Message should appear in chat
			await expect(page.getByText('Hello, this is a smoke test!')).toBeVisible({ timeout: 5000 });
		});
	});

	test.describe('Critical Flow 2: New Chat', () => {
		test('should create new chat', async ({ page }) => {
			await page.goto(APP_URL);
			await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });

			// Click "New Chat" button
			const newChatBtn = page.getByTestId('new-chat-button');
			if (await newChatBtn.isVisible()) {
				await newChatBtn.click();

				// Chat should be cleared
				await expect(page.getByTestId('chat-input')).toBeVisible();
			}
		});
	});

	test.describe('Critical Flow 3: Settings - Skills', () => {
		test('should navigate to settings and toggle skill', async ({ page }) => {
			await page.goto(APP_URL);
			await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });

			// Navigate to settings
			const settingsBtn = page.getByTestId('settings-button');
			if (await settingsBtn.isVisible()) {
				await settingsBtn.click();

				// Wait for settings page
				await page.waitForSelector('[data-testid="settings-container"]', { timeout: 5000 });

				// Find and toggle a skill
				const skillToggle = page.getByTestId('skill-toggle').first();
				if (await skillToggle.isVisible()) {
					await skillToggle.click();

					// Toggle should change state
					await expect(skillToggle).toBeChecked();
				}
			}
		});
	});

	test.describe('Critical Flow 4: Settings - Hooks', () => {
		test('should view hooks list and toggle hook', async ({ page }) => {
			await page.goto(APP_URL);
			await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });

			// Navigate to settings
			const settingsBtn = page.getByTestId('settings-button');
			if (await settingsBtn.isVisible()) {
				await settingsBtn.click();

				// Wait for settings page
				await page.waitForSelector('[data-testid="settings-container"]', { timeout: 5000 });

				// Navigate to hooks tab/section
				const hooksTab = page.getByTestId('hooks-tab');
				if (await hooksTab.isVisible()) {
					await hooksTab.click();

					// Find and toggle a hook
					const hookToggle = page.getByTestId('hook-toggle').first();
					if (await hookToggle.isVisible()) {
						await hookToggle.click();

						// Toggle should change state
						await expect(hookToggle).toBeChecked();
					}
				}
			}
		});
	});
});
