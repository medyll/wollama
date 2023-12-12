import { derived, writable } from 'svelte/store';
import translations from '../locales/translations.js';
import { Utils } from './tools/utils.js';

export const locale = writable('en');
export const locales = Object.keys(translations);

type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends null | undefined
        ? K & string
        : `${K & string}${'' extends DeepKeys<T[K]> ? '' : '.'}${DeepKeys<T[K]>}`;
    }[keyof T]
  : '';

type MyObjectKeys = DeepKeys<typeof translations.en>;

function doTranslate(locale, key, vars) {
	// Let's throw some errors if we're trying to use keys/locales that don't exist.
	// We could improve this by using Typescript and/or fallback values.
	if (!key) throw new Error('no key provided to $t()');
	if (!locale) throw new Error(`no translation for key "${key}"`);

	// Grab the translation from the translations object.
	let text = translations[locale][key.trim()] ?? Utils.resolveDotPath(translations[locale], key);

	// if (!text) throw new Error(`no translation found for ${locale}.${key}`);

	// Replace any passed in variables in the translation string.
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
		(key: MyObjectKeys, vars = {}) =>
			doTranslate($locale, key, vars)
);
