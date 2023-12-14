import { derived, writable } from 'svelte/store';
import translations from '../locales/translations.js';
import { Utils } from './tools/chatMenuList.js';

export const locale = writable<string>('en');
export const locales = Object.keys(translations);

type ResolverPathType<T> = T extends object
	? {
			[K in keyof T]: T[K] extends null | undefined
				? K & string
				: `${K & string}${'' extends ResolverPathType<T[K]> ? '' : '.'}${ResolverPathType<T[K]>}`;
	  }[keyof T]
	: '';

type ResolverKeysType = ResolverPathType<typeof translations.en>;

function doTranslate(locale: string, key: string, vars: Record<string, string | number>) {
	if (!key) throw new Error('no key provided to $t()');
	if (!locale) throw new Error(`no translation for key "${key}"`);

	let text = translations[locale][key.trim()] ?? Utils.resolveDotPath(translations[locale], key);

	Object.keys(vars).map((k) => {
		const regex = new RegExp(`{{${k}}}`, 'g');
		text = text.replace(regex, vars[k]);
	});
	if (!text) console.log('Missing translation for key: ' + key);
	return text ?? key;
}

export const t = derived(
	locale,
	($locale) =>
		(key: ResolverKeysType, vars = {}) =>
			doTranslate($locale, key, vars)
);

export const setLocale = (locale: string) => {
	if (Object.keys(translations).includes(locale)) {
		locale.set(locale);
	}
};
