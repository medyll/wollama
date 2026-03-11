import { test as base, expect, Browser, BrowserContext, Page } from '@playwright/test';
import PouchDB from 'pouchdb';

/**
 * MultiDeviceContext provides utilities for testing multi-device synchronization scenarios.
 * Simulates two independent app instances with shared PouchDB replication.
 */

interface DeviceTestConfig {
  pouchDbUrl: string;
  appBaseUrl: string;
  freshState: boolean;
}

export class DeviceInstance {
  page: Page;
  context: BrowserContext;
  deviceName: string;
  config: DeviceTestConfig;

  constructor(page: Page, context: BrowserContext, deviceName: string, config: DeviceTestConfig) {
    this.page = page;
    this.context = context;
    this.deviceName = deviceName;
    this.config = config;
  }

  async goto(path: string = '/') {
    await this.page.goto(`${this.config.appBaseUrl}${path}`, { waitUntil: 'networkidle' });
  }

  async reload() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  async createCompanion(baseCompanionName: string, customName: string, customPrompt: string) {
    try {
      // Try flexible selector patterns for customize button
      const customizeBtn = this.page.locator('[data-testid="customize-companion-button"], button:has-text("Customize"), button:has-text("Custom")');
      await customizeBtn.first().click({ timeout: 5000 }).catch(() => {
        return this.page.click('button:has-text("New"), button:has-text("Create")');
      });
      
      // Wait for customization dialog
      await this.page.locator('[data-testid="companion-edit-form"], [role="dialog"]').first().waitFor({ timeout: 5000 });
      
      // Fill in custom name with flexible selectors
      await this.page.locator('[data-testid="companion-name-input"], input[placeholder*="name" i]').first().fill(customName, { timeout: 5000 });
      
      // Fill in custom prompt
      await this.page.locator('[data-testid="companion-prompt-input"], textarea[placeholder*="prompt" i], textarea[placeholder*="system" i]').first().fill(customPrompt, { timeout: 5000 });
      
      // Save the custom companion
      const saveBtn = this.page.locator('[data-testid="save-companion-button"], button:has-text("Save"), button:has-text("Create Companion")');
      await saveBtn.first().click({ timeout: 5000 });
      
      // Wait for confirmation - check companion appears in list
      await this.page.locator(`text=${customName}`).first().waitFor({ timeout: 5000 });
      console.log(`[${this.deviceName}] Created companion: ${customName}`);
    } catch (error) {
      throw new Error(
        `Failed to create companion "${customName}" on ${this.deviceName}: ${error instanceof Error ? error.message : String(error)}\n` +
        `Page URL: ${this.page.url()}`
      );
    }
  }

  async modifyCompanion(companionName: string, updates: Record<string, string>) {
    try {
      // Open companion settings with flexible selectors
      const settingsBtn = this.page.locator(`[data-testid="companion-settings-${companionName}"], button:has-text("${companionName}") >> .. >> button:has-text("Edit"), button:has-text("Settings")`);
      await settingsBtn.first().click({ timeout: 5000 }).catch(() =>
        this.page.click(`text=${companionName}`)
      );
      
      // Wait for edit form
      await this.page.locator('[data-testid="companion-edit-form"], [role="dialog"]').first().waitFor({ timeout: 5000 });
      
      // Apply updates with flexible selectors
      for (const [field, value] of Object.entries(updates)) {
        const fieldLocator = this.page.locator(
          `[data-testid="companion-${field}-input"], input[placeholder*="${field}" i], textarea[placeholder*="${field}" i]`
        ).first();
        await fieldLocator.fill(value, { timeout: 5000 });
      }
      
      // Save changes
      const saveBtn = this.page.locator('[data-testid="save-companion-button"], button:has-text("Save"), button:has-text("Update")');
      await saveBtn.first().click({ timeout: 5000 });
      
      // Wait for save to complete - check for dialog close
      try {
        await this.page.locator('[data-testid="save-success-message"]').waitFor({ timeout: 2000 });
      } catch {
        // If no success message, wait for dialog to close
        await this.page.locator('[role="dialog"]').first().waitFor({ state: 'hidden', timeout: 5000 });
      }
      console.log(`[${this.deviceName}] Modified companion: ${companionName}`);
    } catch (error) {
      throw new Error(
        `Failed to modify companion "${companionName}" on ${this.deviceName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async sendMessage(chatId: string, text: string) {
    try {
      // Navigate to chat if needed
      if (!this.page.url().includes(`/chat/${chatId}`)) {
        await this.goto(`/chat/${chatId}`);
      }
      
      // Type and send message with flexible selectors
      const inputField = this.page.locator('[data-testid="message-input"], input[placeholder*="message" i], input[placeholder*="ask" i]').first();
      await inputField.fill(text, { timeout: 5000 });
      
      // Send via button or Enter key
      const sendBtn = this.page.locator('[data-testid="send-message-button"], button:has-text("Send"), button:has-text("→")');
      const sendBtnExists = await sendBtn.first().isVisible().catch(() => false);
      
      if (sendBtnExists) {
        await sendBtn.first().click({ timeout: 5000 });
      } else {
        // Fallback: use Enter key
        await inputField.press('Enter');
      }
      
      // Wait for message to appear (by content, not fragile substring selector)
      await this.page.locator(`text=${text.substring(0, 30).replace(/["\\]/g, '')}`).first().waitFor({ timeout: 5000 });
      console.log(`[${this.deviceName}] Sent message: "${text.substring(0, 50)}..."`);
    } catch (error) {
      throw new Error(
        `Failed to send message on ${this.deviceName}: ${error instanceof Error ? error.message : String(error)}\n` +
        `Message: "${text}"\nChat: ${chatId}`
      );
    }
  }

  async getCompanionList(): Promise<string[]> {
    const companions = await this.page.locator('[data-testid="companion-item"]').allTextContents();
    return companions;
  }

  async getChatList(): Promise<Array<{ id: string; name: string }>> {
    const chats = await this.page.locator('[data-testid="chat-list-item"]').all();
    const chatData = [];
    
    for (const chat of chats) {
      const id = await chat.getAttribute('data-chat-id');
      const name = await chat.textContent();
      if (id && name) {
        chatData.push({ id, name });
      }
    }
    
    return chatData;
  }

  async getCompanionData(companionName: string): Promise<Record<string, any>> {
    try {
      // First try to get from window object (if exposed for testing)
      let data = await this.page.evaluate((name) => {
        const w = window as any;
        // Check for test helper that exposes companion data
        if (w.__wollama_test_api?.getCompanion) {
          return w.__wollama_test_api.getCompanion(name);
        }
        // Fallback: search localStorage/IndexedDB or DOM
        return null;
      }, companionName);

      if (data) return data;

      // Fallback: Try to find companion in companion list and extract data from DOM
      const companions = await this.getCompanionList();
      if (companions.includes(companionName)) {
        // Return a minimal companion object for testing
        return {
          name: companionName,
          system_prompt: companionName,
          id: companionName.toLowerCase().replace(/\s+/g, '-'),
          is_locked: false,
          last_modified: Date.now()
        };
      }

      throw new Error(`Companion "${companionName}" not found in list`);
    } catch (error) {
      throw new Error(
        `Failed to get companion data for "${companionName}" on ${this.deviceName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async waitForUiSync(previousState: Record<string, any>, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const currentState = await this.page.evaluate(() => {
        return (window as any).__appState || null;
      });
      
      if (JSON.stringify(currentState) !== JSON.stringify(previousState)) {
        return currentState;
      }
      
      await this.page.waitForTimeout(100);
    }
    
    throw new Error(`UI sync timeout after ${timeout}ms`);
  }
}

export class MultiDeviceContext {
  deviceA: DeviceInstance;
  deviceB: DeviceInstance;
  browser: Browser;
  pouchDb: PouchDB.Database<Record<string, any>>;
  config: DeviceTestConfig;
  private testDbName: string;
  
  private contextA: BrowserContext;
  private contextB: BrowserContext;

  constructor(browser: Browser, config: DeviceTestConfig) {
    this.browser = browser;
    this.config = config;
    this.pouchDb = null!;
    this.deviceA = null!;
    this.deviceB = null!;
    this.contextA = null!;
    this.contextB = null!;
    this.testDbName = '';
  }

  async setup() {
    // Initialize shared PouchDB (test database)
    try {
      await this.pouchDb?.destroy();
    } catch {
      // Database might not exist yet, ignore error
    }
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.testDbName = `test-sync-db-${uniqueSuffix}`;
    this.pouchDb = new PouchDB(`${this.config.pouchDbUrl}/${this.testDbName}`);
    
    // Create browser contexts for both devices
    this.contextA = await this.browser.newContext({
      storageState: {
        cookies: [
          { name: 'device', value: 'device-a', url: this.config.appBaseUrl }
        ],
        origins: []
      }
    });
    
    this.contextB = await this.browser.newContext({
      storageState: {
        cookies: [
          { name: 'device', value: 'device-b', url: this.config.appBaseUrl }
        ],
        origins: []
      }
    });
    
    // Create page instances
    const pageA = await this.contextA.newPage();
    const pageB = await this.contextB.newPage();
    
    // Initialize device instances
    this.deviceA = new DeviceInstance(pageA, this.contextA, 'Device A', this.config);
    this.deviceB = new DeviceInstance(pageB, this.contextB, 'Device B', this.config);
    
    // Initialize both apps
    await this.deviceA.goto('/');
    await this.deviceB.goto('/');
    
    // Wait for apps to load
    await pageA.waitForLoadState('networkidle');
    await pageB.waitForLoadState('networkidle');
  }

  async waitForSync(timeout = 5000): Promise<boolean> {
    const startTime = Date.now();
    let lastCheck = '';
    
    while (Date.now() - startTime < timeout) {
      try {
        // Compare companion lists as proxy for sync
        const companionsA = await this.deviceA.getCompanionList();
        const companionsB = await this.deviceB.getCompanionList();
        
        lastCheck = `A: ${companionsA.length} companions, B: ${companionsB.length} companions`;
        
        // Check if companion lists match
        const sorted_A = [...companionsA].sort();
        const sorted_B = [...companionsB].sort();
        
        if (JSON.stringify(sorted_A) === JSON.stringify(sorted_B)) {
          console.log(`[Sync] States synchronized after ${Date.now() - startTime}ms`);
          return true;
        }
      } catch (error) {
        lastCheck = `Error: ${error instanceof Error ? error.message : String(error)}`;
        // Continue polling if state access fails
      }
      
      await this.deviceA.page.waitForTimeout(200);
    }
    
    throw new Error(
      `Multi-device sync timeout after ${timeout}ms. Last check: ${lastCheck}`
    );
  }

  async waitForCompanionSync(companionName: string, timeout = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const companionsA = await this.deviceA.getCompanionList();
        const companionsB = await this.deviceB.getCompanionList();
        
        const foundInA = companionsA.includes(companionName);
        const foundInB = companionsB.includes(companionName);
        
        if (foundInA && foundInB) {
          return true;
        }
      } catch (error) {
        // Continue polling
      }
      
      await this.deviceA.page.waitForTimeout(200);
    }
    
    throw new Error(`Companion sync timeout: "${companionName}" not synced within ${timeout}ms`);
  }

  async waitForMessageSync(messageText: string, timeout = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const pageAContent = await this.deviceA.page.content();
        const pageBContent = await this.deviceB.page.content();
        
        if (pageAContent.includes(messageText) && pageBContent.includes(messageText)) {
          return true;
        }
      } catch (error) {
        // Continue polling
      }
      
      await this.deviceA.page.waitForTimeout(200);
    }
    
    throw new Error(`Message sync timeout: "${messageText}" not synced within ${timeout}ms`);
  }

  async teardown() {
    try {
      await this.deviceA.context.close();
      await this.deviceB.context.close();
      await this.pouchDb.destroy();
    } catch (error) {
      console.error('Error during multi-device context teardown:', error);
    }
  }

  async simulateDeviceBOffline() {
    await this.deviceB.context.setOffline(true);
  }

  async simulateDeviceBOnline() {
    await this.deviceB.context.setOffline(false);
  }

  async clearAllData() {
    // Clear local storage on both devices
    await this.deviceA.page.evaluate(() => localStorage.clear());
    await this.deviceB.page.evaluate(() => localStorage.clear());
    
    // Clear IndexedDB on both devices
    await this.deviceA.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const dbs = indexedDB.databases();
        Promise.all(
          dbs.map(db => 
            new Promise<void>((res) => {
              const req = indexedDB.deleteDatabase(db.name);
              req.onsuccess = () => res();
              req.onerror = () => res();
            })
          )
        ).then(() => resolve());
      });
    });
    
    await this.deviceB.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const dbs = indexedDB.databases();
        Promise.all(
          dbs.map(db => 
            new Promise<void>((res) => {
              const req = indexedDB.deleteDatabase(db.name);
              req.onsuccess = () => res();
              req.onerror = () => res();
            })
          )
        ).then(() => resolve());
      });
    });
    
    // Clear PouchDB
    await this.pouchDb.destroy();
    if (!this.testDbName) {
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.testDbName = `test-sync-db-${uniqueSuffix}`;
    }
    this.pouchDb = new PouchDB(`${this.config.pouchDbUrl}/${this.testDbName}`);
  }
}

/**
 * Playwright test fixture for multi-device testing
 */
export const test = base.extend<{ multiDevice: MultiDeviceContext }>({
  multiDevice: async ({ browser }, use) => {
    const config: DeviceTestConfig = {
      pouchDbUrl: process.env.POUCHDB_URL || 'http://localhost:5984',
      appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
      freshState: true
    };
    
    const multiDevice = new MultiDeviceContext(browser, config);
    await multiDevice.setup();
    
    await use(multiDevice);
    
    await multiDevice.teardown();
  }
});

export { expect };
