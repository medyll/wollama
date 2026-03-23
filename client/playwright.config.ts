import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Wollama
 * 
 * Runs tests for:
 * - Story 5.3: E2E Test for Onboarding Journey
 * - Story 5.4: E2E Test for Multi-Device Sync
 */

export default defineConfig({
	testDir: './e2e/tests',
	testMatch: '**/*.spec.ts',

	// Test execution settings
	fullyParallel: false, // Run tests sequentially to avoid port conflicts
	forbidOnly: !!process.env['CI'],
	retries: process.env['CI'] ? 2 : 0,
	workers: 1, // Single worker to avoid race conditions

	// Timeout settings
	timeout: 120 * 1000, // 120 seconds per test
	expect: {
		timeout: 5000
	},

	// Reporting
	reporter: [
		['html'],
		['junit', { outputFile: 'test-results/junit.xml' }],
		['json', { outputFile: 'test-results/results.json' }],
		['list']
	],

	// Web server configuration
	webServer: [
		{
			command: 'npm run dev',
			port: 5173,
			timeout: 120 * 1000,
			reuseExistingServer: !process.env['CI']
		},
		{
			command: 'npx pouchdb-server --port 5984',
			port: 5984,
			timeout: 90 * 1000,
			reuseExistingServer: false
		}
	],

	use: {
		// Base URL for all requests
		baseURL: 'http://localhost:5173',

		// Screenshot and video configuration
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		trace: 'on-first-retry'
	},

	// Project configurations for different browsers
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},

		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},

		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		},

		// Mobile testing
		{
			name: 'Mobile Chrome',
			use: { ...devices['Galaxy S5'] }
		}
	]
});
