/** The themes the app ships with. */
export type AppTheme = 'light' | 'dark';

/** Themes in the order the settings picker lists them. */
export const APP_THEMES: ReadonlyArray<{ id: AppTheme; label: string }> = [
	{ id: 'light', label: 'Light' },
	{ id: 'dark', label: 'Dark' }
];

/** Coerces a stored or user-supplied value to a valid theme. Anything that is not
 *  `'dark'` falls back to `'light'`. */
export function normalizeTheme(theme: unknown): AppTheme {
	return theme === 'dark' ? 'dark' : 'light';
}
