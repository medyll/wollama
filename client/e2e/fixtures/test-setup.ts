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
const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Complete onboarding flow programmatically
 */
export async function completeOnboarding(page: Page, options?: {
	nickname?: string;
	model?: string;
	skipOllamaTest?: boolean;
}) {
	const {
		nickname = 'Test User',
		model = 'mistral',
		skipOllamaTest = true
	} = options || {};

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

	// Step 3: Complete
	await page.waitForSelector('[data-testid="wizard-finish-button"]', { timeout: 5000 });
	await page.getByTestId('wizard-finish-button').click();
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
			dbs.map((db: any) =>
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
export async function setupTestState(page: Page, options?: {
	nickname?: string;
	model?: string;
}) {
	const { nickname = 'Test User', model = 'mistral' } = options || {};

	// Set localStorage directly to skip onboarding
	await page.addInitScript((data) => {
		localStorage.setItem('wollama_onboarding_completed', 'true');
		localStorage.setItem('wollama_user_preferences', JSON.stringify({
			onboarding_completed: true,
			defaultModel: data.model,
			nickname: data.nickname
		}));
	}, { nickname, model });
}

/**
 * Mock Ollama API responses
 */
export async function mockOllamaResponses(page: Page, options?: {
	models?: string[];
	response?: string;
	delay?: number;
}) {
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
				body: JSON.stringify({ models: models.map(name => ({ name, model: name })) })
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
 * Wait for chat to be ready
 */
export async function waitForChatReady(page: Page, timeout = 10000) {
	await page.waitForSelector('[data-testid="message-input"]', { timeout });
}

/**
 * Send a message and wait for response
 */
export async function sendMessage(page: Page, text: string, options?: {
	waitForResponse?: boolean;
	responseTimeout?: number;
}) {
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
 * Create a new chat
 */
export async function createNewChat(page: Page) {
	const newChatBtn = page.locator('button:has-text("New Chat"), button:has-text("Nouveau"), #sidebar-nav button').first();
	await expect(newChatBtn).toBeVisible();
	await newChatBtn.click();
	await page.waitForTimeout(500);
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
	return companions.map(c => c.trim());
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
