export type AppTheme = 'light' | 'dark';

export const APP_THEMES: ReadonlyArray<{ id: AppTheme; label: string }> = [
	{ id: 'light', label: 'Light' },
	{ id: 'dark', label: 'Dark' }
];

export function normalizeTheme(theme: unknown): AppTheme {
	return theme === 'dark' ? 'dark' : 'light';
}
