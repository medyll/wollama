/**
 * Page Objects for Wollama E2E Tests
 * 
 * Encapsulates locators and interactions for different pages
 * Makes tests more maintainable and readable
 */

import { Page, expect } from '@playwright/test';

/**
 * OnboardingPage - Handles all onboarding wizard interactions
 */
export class OnboardingPage {
	constructor(private page: Page) {}

	// Locators
	get wizardContainer() {
		return this.page.locator('[data-testid="onboarding-wizard"]');
	}

	get wizardTitle() {
		return this.page.locator('[data-testid="wizard-title"]');
	}

	get nextButton() {
		return this.page.locator('[data-testid="wizard-next-button"]');
	}

	get backButton() {
		return this.page.locator('[data-testid="wizard-back-button"]');
	}

	get serverUrlInput() {
		return this.page.locator('[data-testid="server-url-input"]');
	}

	get testConnectionButton() {
		return this.page.locator('[data-testid="test-connection-button"]');
	}

	get connectionSuccessMessage() {
		return this.page.locator('[data-testid="connection-success"]');
	}

	get connectionErrorMessage() {
		return this.page.locator('[data-testid="connection-error"]');
	}

	get companionSelector() {
		return this.page.locator('[data-testid="companion-selector"]');
	}

	get companionCards() {
		return this.page.locator('[data-testid="companion-card"]');
	}

	get completeSetupButton() {
		return this.page.locator('[data-testid="complete-setup-button"]');
	}

	// Actions
	async waitForWizard() {
		await this.wizardContainer.waitFor({ state: 'visible' });
	}

	async enterServerUrl(url: string) {
		await this.serverUrlInput.fill(url);
	}

	async clickTestConnection() {
		await this.testConnectionButton.click();
	}

	async waitForConnectionSuccess() {
		await this.connectionSuccessMessage.waitFor({ state: 'visible' });
	}

	async waitForConnectionError() {
		await this.connectionErrorMessage.waitFor({ state: 'visible' });
	}

	async clickNext() {
		await this.nextButton.click();
	}

	async clickBack() {
		await this.backButton.click();
	}

	async selectCompanion(index: number) {
		const cards = this.companionCards;
		await cards.nth(index).click();
	}

	async waitForCompanionSelection() {
		await this.companionSelector.waitFor({ state: 'visible' });
	}

	async completeSetup() {
		await this.completeSetupButton.click();
	}

	// Assertions
	async assertWizardVisible() {
		await expect(this.wizardContainer).toBeVisible();
	}

	async assertWizardHidden() {
		await expect(this.wizardContainer).not.toBeVisible();
	}

	async assertNextButtonEnabled() {
		await expect(this.nextButton).toBeEnabled();
	}

	async assertNextButtonDisabled() {
		await expect(this.nextButton).toBeDisabled();
	}

	async assertCompanionsLoaded(expectedCount: number) {
		await expect(this.companionCards).toHaveCount(expectedCount);
	}
}

/**
 * ChatPage - Handles chat interface interactions
 */
export class ChatPage {
	constructor(private page: Page) {}

	// Locators
	get messageInput() {
		return this.page.locator('[data-testid="message-input"]');
	}

	get sendButton() {
		return this.page.locator('[data-testid="send-button"]');
	}

	get chatMessages() {
		return this.page.locator('[data-testid="chat-message"]');
	}

	get loadingIndicator() {
		return this.page.locator('[data-testid="loading-indicator"]');
	}

	get chatContainer() {
		return this.page.locator('[data-testid="chat-container"]');
	}

	get chatList() {
		return this.page.locator('[data-testid="chat-list"]');
	}

	get chatListItems() {
		return this.page.locator('[data-testid="chat-list-item"]');
	}

	// Actions
	async typeMessage(text: string) {
		await this.messageInput.fill(text);
	}

	async sendMessage(text: string) {
		await this.typeMessage(text);
		await this.sendButton.click();
	}

	async sendMessageWithEnter(text: string) {
		await this.typeMessage(text);
		await this.messageInput.press('Enter');
	}

	async waitForUserMessage(text: string) {
		await this.page
			.locator(`[data-testid="chat-message"][data-role="user"]:has-text("${text}")`)
			.waitFor({ state: 'visible' });
	}

	async waitForAssistantMessage() {
		await this.page
			.locator('[data-testid="chat-message"][data-role="assistant"]')
			.first()
			.waitFor({ state: 'visible' });
	}

	async waitForLoadingComplete() {
		await this.loadingIndicator.waitFor({ state: 'hidden' });
	}

	// Assertions
	async assertMessageInChat(text: string) {
		await expect(this.page.locator(`[data-testid="chat-message"]:has-text("${text}")`)).toBeVisible();
	}

	async assertMessageCount(expectedCount: number) {
		await expect(this.chatMessages).toHaveCount(expectedCount);
	}

	async assertChatListVisible() {
		await expect(this.chatList).toBeVisible();
	}

	async assertChatListItemsExist(expectedCount: number) {
		await expect(this.chatListItems).toHaveCount(expectedCount);
	}

	async assertInputFieldFocused() {
		await expect(this.messageInput).toBeFocused();
	}
}

/**
 * AppPage - Handles general app interactions
 */
export class AppPage {
	constructor(private page: Page) {}

	async goto(url: string = 'http://localhost:5173') {
		await this.page.goto(url);
	}

	async reload() {
		await this.page.reload();
	}

	async waitForPageLoad() {
		await this.page.waitForLoadState('networkidle');
	}

	async clearLocalStorage() {
		await this.page.evaluate(() => localStorage.clear());
	}

	async clearIndexedDB() {
		await this.page.evaluate(() => {
			return new Promise<void>((resolve, reject) => {
				const dbs = indexedDB.databases
					? indexedDB.databases()
					: Promise.resolve([]).then(() => {
							// Fallback for older browsers
							return [];
						});

				if (dbs instanceof Promise) {
					dbs.then((databases: any[]) => {
						let completed = 0;
						if (databases.length === 0) {
							resolve();
							return;
						}

						databases.forEach((db: any) => {
							const request = indexedDB.deleteDatabase(db.name);
							request.onsuccess = () => {
								completed++;
								if (completed === databases.length) {
									resolve();
								}
							};
							request.onerror = reject;
						});
					}).catch(reject);
				} else {
					// Manually delete known databases
					indexedDB.deleteDatabase('wollama_db');
					indexedDB.deleteDatabase('rxdb_wollama');
					resolve();
				}
			});
		});
	}

	async freshAppState() {
		await this.clearLocalStorage();
		await this.clearIndexedDB();
		await this.reload();
	}
}
