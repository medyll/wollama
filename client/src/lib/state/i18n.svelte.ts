import { translations } from '../../locales/translations.js';
import { userState } from './user.svelte.js';

class I18nState {
	// Helper to resolve dot notation keys (e.g. "settings.general")
	resolveDotPath(obj: any, path: string) {
		return path.split('.').reduce((acc, part) => acc && acc[part], obj);
	}

	// The main translation function
	// Since it accesses userState.preferences.locale (which is a $state),
	// Svelte 5 will automatically track this dependency when used in templates/effects.
	t(key: string, vars: Record<string, string | number> = {}) {
		// Access the state directly to ensure reactivity
		const locale = userState.preferences.locale;
		const currentLocale = (locale in translations ? locale : 'en') as keyof typeof translations;

		// Get translation data for current locale, fallback to English
		const localeData = translations[currentLocale] || translations['en'];

		// Try to find the text
		let text = this.resolveDotPath(localeData, key);

		// If not found and we are not in English, try English fallback
		if (!text && currentLocale !== 'en') {
			const enData = translations['en'];
			text = this.resolveDotPath(enData, key);
		}

		// If still not found, return the key itself
		if (!text) return key;

		// Replace variables {{varName}}
		Object.keys(vars).forEach((k) => {
			const regex = new RegExp(`{{${k}}}`, 'g');
			text = text.replace(regex, String(vars[k]));
		});

		return text;
	}
}

export const i18n = new I18nState();
export const t = (key: string, vars?: Record<string, string | number>) => i18n.t(key, vars);
