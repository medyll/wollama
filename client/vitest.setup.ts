import { vi } from 'vitest';

// Ensure browser-like environment for component tests
if (typeof window !== 'undefined') {
	// Polyfill any missing browser APIs if needed
	if (!window.matchMedia) {
		window.matchMedia = () => ({
			matches: false,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		});
	}
}

// Mock $app/environment for browser flag
vi.mock('$app/environment', () => ({
	browser: true,
	building: false,
	dev: true,
	version: '1.0.0'
}));
