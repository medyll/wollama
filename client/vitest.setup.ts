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

// Ensure localStorage is always available in JSDOM
const store: Record<string, string> = {};
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
	Object.defineProperty(globalThis, 'localStorage', {
		value: {
			getItem: (key: string) => store[key] || null,
			setItem: (key: string, value: string) => {
				store[key] = value;
			},
			removeItem: (key: string) => {
				delete store[key];
			},
			clear: () => {
				Object.keys(store).forEach((key) => delete store[key]);
			},
			key: (index: number) => Object.keys(store)[index] || null,
			get length() {
				return Object.keys(store).length;
			}
		},
		writable: false,
		configurable: true
	});
}

// Mock $app/environment for browser flag
vi.mock('$app/environment', () => ({
	browser: true,
	building: false,
	dev: true,
	version: '1.0.0'
}));
