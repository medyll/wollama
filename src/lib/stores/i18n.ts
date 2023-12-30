import { derived, get, writable } from 'svelte/store';
import translations from '../../locales/translations.js';
import { settings } from './settings.js';
import { engine } from '$lib/tools/engine.js';

export const missingLocale = writable<string[]>([]);
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

let timerUn: NodeJS.Timeout;

function doTranslate(locale: string = 'en', key: string, vars: Record<string, string | number>) {
	if (!key) throw new Error('no key provided to $t()');
	if (!locale) throw new Error(`no locale for "${key}"`);
	if (!translations[locale] && locale !== 'en') locale = 'en';

	let text = translations[locale][key.trim()] ?? engine.resolveDotPath(translations[locale], key);

	Object.keys(vars).map((k) => {
		const regex = new RegExp(`{{${k}}}`, 'g');
		text = text.replace(regex, vars[k]);
	});
	if (!text) {
		clearTimeout(timerUn)
		timerUn = setTimeout(async () => {
			await missingLocale.update((n) => [...n, key].filter((v, i, a) => a.indexOf(v) === i));
			console.log('Missing translation' , get(missingLocale));
		}, 500);
	}
	return text ?? key;
}

export const t = derived(
	settings,
	($settings) =>
		(key: ResolverKeysType, vars = {}) =>
			doTranslate($settings.locale, key, vars)
);
