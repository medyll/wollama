/**
 * E2E Test Setup Utilities
 *
 * Provides helpers for:
 * - Mocking Ollama API responses
 * - Resetting database state between tests
 * - Completing onboarding programmatically
 */

import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5176';

/**
 * Complete onboarding flow programmatically
 */
export async function completeOnboarding(
	page: Page,
	options?: {
		nickname?: string;
		model?: string;
		skipOllamaTest?: boolean;
	}
) {
	const { nickname = 'Test User', skipOllamaTest = true } = options || {};

	await page.goto(`${BASE_URL}/onboarding`);
	await page.waitForLoadState('networkidle');

	// Step 1: Profile
	await page.locator('#nickname').fill(nickname);
	await page.getByTestId('wizard-next-button').click();
	await page.waitForTimeout(500);

	// Step 2: Ollama connection - skip if requested
	if (!skipOllamaTest) {
		await page.waitForSelector('[data-testid="connection-success"]', { timeout: 10000 });
	}

	await page.getByTestId('wizard-next-button').click();
	await page.waitForTimeout(500);

	// Step 3: choose the first imported companion and complete the wizard
	const firstCompanion = page.getByTestId('companion-card').first();
	await expect(firstCompanion).toBeVisible({ timeout: 10_000 });
	await firstCompanion.click();
	await page.getByTestId('wizard-next-button').click();
	await expect(page).toHaveURL(/\/chat\/new$/, { timeout: 10_000 });
	await page.waitForLoadState('networkidle');
}

/**
 * Reset database to clean state
 * Clears IndexedDB and localStorage
 */
export async function resetDatabaseState(page: Page) {
	await page.evaluate(() => {
		// Clear localStorage
		localStorage.clear();

		// Clear IndexedDB
		const dbs = (window as any).indexedDB.databases();
		Promise.all(
			dbs.map(
				(db: any) =>
					new Promise<void>((res) => {
						const req = (window as any).indexedDB.deleteDatabase(db.name);
						req.onsuccess = () => res();
						req.onerror = () => res();
					})
			)
		);
	});

	// Wait for cleanup
	await page.waitForTimeout(500);
}

/**
 * Set up test state with onboarding completed
 */
export async function setupTestState(
	page: Page,
	options?: {
		nickname?: string;
		model?: string;
		uid?: string;
		serverUrl?: string;
	}
) {
	const { nickname = 'Test User', model = 'mistral', uid = 'e2e-user', serverUrl } = options || {};

	// Set localStorage directly to skip onboarding. A uid is part of that state:
	// companion listing and chat ownership are scoped by user, and without one the
	// app renders as a signed-out shell.
	await page.addInitScript(
		(data) => {
			localStorage.setItem(
				'wollama_user',
				JSON.stringify({
					nickname: data.nickname,
					uid: data.uid,
					email: null,
					photoURL: null,
					preferences: {
						onboarding_completed: true,
						defaultModel: data.model,
						...(data.serverUrl ? { serverUrl: data.serverUrl } : {})
					}
				})
			);
		},
		{ nickname, model, uid, serverUrl }
	);
}

/**
 * Mock Ollama API responses
 */
export async function mockOllamaResponses(
	page: Page,
	options?: {
		models?: string[];
		response?: string;
		delay?: number;
	}
) {
	const {
		models = ['mistral', 'llama2', 'gemma'],
		response = 'This is a mocked AI response for testing.',
		delay = 500
	} = options || {};

	await page.route('**/api/ollama/**', async (route) => {
		const request = route.request();
		const url = request.url();

		if (url.includes('/api/tags')) {
			// Return list of models
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ models: models.map((name) => ({ name, model: name })) })
			});
		} else if (url.includes('/api/generate') || url.includes('/api/chat')) {
			// Return mocked response with delay
			await page.waitForTimeout(delay);
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ response, message: { role: 'assistant', content: response } })
			});
		} else {
			await route.continue();
		}
	});
}

/**
 * Mark the Wollama server as reachable.
 *
 * The splash screen probes `/api/health` and flips `connectionState`; when it is
 * false `generateResponse` refuses to call the model at all. Specs that expect an
 * assistant reply must serve this route.
 */
export async function mockServerHealth(page: Page, options?: { ok?: boolean }) {
	const { ok = true } = options || {};

	await page.route('**/api/health', async (route) => {
		await route.fulfill({
			status: ok ? 200 : 503,
			contentType: 'application/json',
			body: JSON.stringify({ status: ok ? 'ok' : 'down', ollama: ok })
		});
	});
}

/**
 * Serve the hooks registry the settings page reads, and capture toggles.
 * Returns the list of PATCH bodies the page sent.
 */
export async function mockHooks(
	page: Page,
	hooks: Array<{ _id: string; name: string; event: string; is_enabled: boolean; handler_type?: string }>
) {
	const toggles: Array<{ id: string; is_enabled: boolean }> = [];

	await page.route('**/api/hooks', async (route) => {
		await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(hooks) });
	});

	await page.route('**/api/hooks/*', async (route) => {
		const id = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop() ?? '');
		const body = route.request().postDataJSON() as { is_enabled: boolean };
		toggles.push({ id, is_enabled: body.is_enabled });
		await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
	});

	return toggles;
}

/**
 * Mock the Wollama generation endpoint.
 *
 * `chatService.generateResponse` streams NDJSON: one `{ message: { content } }`
 * object per line, terminated by `{ done: true }`. Serving a canned stream keeps
 * the chat specs independent of Ollama and of the Node server.
 */
export async function mockChatGeneration(
	page: Page,
	options?: {
		reply?: string;
		chunks?: string[];
	}
) {
	const { reply = 'Mocked assistant reply.' } = options || {};
	const chunks = options?.chunks ?? [reply];

	await page.route('**/api/chat/generate', async (route) => {
		const lines = [
			...chunks.map((chunk) => JSON.stringify({ message: { role: 'assistant', content: chunk } })),
			JSON.stringify({ done: true })
		];
		const body = lines.join(String.fromCharCode(10)) + String.fromCharCode(10);

		await route.fulfill({
			status: 200,
			contentType: 'application/x-ndjson',
			body
		});
	});
}

/**
 * Deletes the chat currently open in the composer (trash button + confirmation).
 */
export async function deleteCurrentChat(page: Page, options?: { confirm?: boolean }) {
	const { confirm = true } = options || {};

	await page.getByRole('button', { name: 'delete', exact: true }).click();
	const confirmBtn = page.getByRole('button', { name: 'Confirm', exact: true });
	await expect(confirmBtn).toBeVisible();

	if (confirm) {
		await confirmBtn.click();
	} else {
		await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	}
}

/**
 * Wait for chat to be ready
 */
export async function waitForChatReady(page: Page, timeout = 10000) {
	// The splash screen is a native <dialog> opened with showModal(), which makes the
	// rest of the page inert: fill()/press() land on nothing until it closes. It holds
	// for a 2s minimum, and is removed from the DOM once done — so wait for it to go,
	// not merely to be hidden (it is not in the DOM on the very first frame either).
	const splash = page.locator('dialog.splash-dialog');
	await splash.waitFor({ state: 'attached', timeout: 5_000 }).catch(() => {});
	await splash.waitFor({ state: 'detached', timeout: Math.max(timeout, 15_000) });
	await page.waitForSelector('[data-testid="message-input"]', { timeout });
}

/**
 * Send a message and wait for response
 */
export async function sendMessage(
	page: Page,
	text: string,
	options?: {
		waitForResponse?: boolean;
		responseTimeout?: number;
	}
) {
	const { waitForResponse = true, responseTimeout = 15000 } = options || {};

	const input = page.getByTestId('message-input');
	await input.fill(text);
	await input.press('Enter');

	// Wait for user message to appear
	await expect(page.locator(`[data-testid="chat-message"]:has-text("${text}")`).first()).toBeVisible({ timeout: 5000 });

	if (waitForResponse) {
		// Wait for assistant response
		await page.waitForSelector('[data-testid="chat-message"][data-role="assistant"]', { timeout: responseTimeout });
	}
}

/**
 * Create a new chat (sidebar action -> /chat/new)
 */
export async function createNewChat(page: Page) {
	const newChatBtn = page.locator('button.sidebar-new-chat');
	await expect(newChatBtn).toBeVisible();
	await newChatBtn.click();
	await expect(page).toHaveURL(/\/chat\/new$/, { timeout: 10_000 });
	await waitForChatReady(page);
}

/**
 * Get list of chats from sidebar
 */
export async function getChatList(page: Page): Promise<Array<{ id: string; name: string }>> {
	const chatItems = await page.getByTestId('chat-list-item').all();
	const chats = [];

	for (const item of chatItems) {
		const id = await item.getAttribute('data-chat-id');
		const name = await item.textContent();
		if (id && name) {
			chats.push({ id, name: name.trim() });
		}
	}

	return chats;
}

/**
 * Get list of companions
 */
export async function getCompanionList(page: Page): Promise<string[]> {
	const companions = await page.getByTestId('companion-card').allTextContents();
	return companions.map((c) => c.trim());
}

/**
 * Select a companion by name
 */
export async function selectCompanion(page: Page, name: string) {
	const companionCard = page.getByTestId('companion-card').filter({ hasText: name });
	await expect(companionCard).toBeVisible();
	await companionCard.click();
	await page.waitForTimeout(500);
}
