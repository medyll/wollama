import { describe, expect, it } from 'vitest';
import { APP_THEMES, normalizeTheme } from './theme';

describe('application themes', () => {
	it('exposes exactly the two named themes', () => {
		expect(APP_THEMES).toEqual([
			{ id: 'light', label: 'Light' },
			{ id: 'dark', label: 'Dark' }
		]);
	});

	it('accepts only current theme identifiers', () => {
		expect(normalizeTheme('dark')).toBe('dark');
		expect(normalizeTheme('light')).toBe('light');
		expect(normalizeTheme('unknown-theme')).toBe('light');
	});
});
