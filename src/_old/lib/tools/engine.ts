import { connectionChecker } from '$lib/stores/connection';
import { settings } from '$lib/stores/settings.svelte';
import { get } from 'svelte/store';
import { WollamaApi } from '../db/wollamaApi';
import { goto } from '$app/navigation';
import type { ResolverPathType } from '$lib/stores/i18n';

/**
 * Represents the engine class.
 */

let ollamaCheckRetries: NodeJS.Timeout;
export class engine {
	public static applyTheme(theme: string) {
		const currentTheme = theme == 'light' ? 'dark' : 'light';

		if (document?.documentElement) {
			document.documentElement.classList.replace(currentTheme, theme);
		}
	}

	public static goto(url: string) {
		const locale = get(settings).locale;
		const prefix = ['en', undefined].includes(locale) ? '' : `/${locale}`;
		goto(`${prefix}${url}`);
	}

	public static resolveDotPath<T = unknown>(object: Record<string, any>, path: string, defaultValue?: any): T {
		return (path.split('.').reduce((r, s) => (r ? r[s] : defaultValue), object) ?? undefined) as T;
	}

	/**
	 * Translates the keys of an input object based on a given mask object.
	 *
	 * @template IN - The type of the input object.
	 * @template OUT - The type of the output object.
	 * @param data - The input object to translate.
	 * @param mask - The mask object that defines the translation mapping.
	 * @param keepEmpty - A boolean indicating whether to keep empty values in the output object. Default is false.
	 * @returns The translated output object.
	 */
	public static translateKeys<IN = Partial<Record<string, any>>, OUT = Record<string, any>>(
		data: IN,
		mask: Record<keyof ResolverPathType<IN>, keyof OUT>,
		keepEmpty: boolean = false
	): T {
		const result = {} as OUT;

		for (const key in mask) {
			const value = engine.resolveDotPath<IN>(data as Record<string, any>, key);
			const keyName = key.split('.')[0] as keyof OUT;

			if (value !== undefined) {
				result[keyName] = value as any;
			} else if (keepEmpty) {
				result[keyName] = undefined as any;
			}
		}

		return result as OUT;
	}

	public static async checkOllamaEndPoints(fn: () => any = () => {}) {
		console.log('Checking Ollama endpoints...');
		connectionChecker.setConnectionStatus('connecting');
		const models = (await WollamaApi.tags()) ?? {};

		try {
			let tg = await WollamaApi.tags();
			console.log('---------------------------------------------------------------------------', {
				tg
			});
		} catch (error) {
			alert('Error');
			throw error;
		}
		/* WollamaApi.tags()
            .then((data) => {
                console.log('rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
                connectionChecker.setConnectionStatus('connected');
                connectionChecker.setKey('connectionRetryCount', 0);
            })
            .catch((error) => {
                console.log('rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
                connectionChecker.incrementConnectionRetryCount();
                connectionChecker.setConnectionStatus('error');
                // ollamaCheckRetries
                ollamaCheckRetries = setTimeout(() => this.checkOllamaEndPoints(fn), connectionChecker.get('connectionRetryTimeout'));
            })
            .finally(() => {
                if (connectionChecker.get('connectionStatus') != 'connected' && connectionChecker.get('connectionRetryTimeout') != 0) {
                }
            }); */

		function getRetryTimeOut(retryCount: number, maxRetries?: number = 5) {
			const retryInterval = retryCount * 3.5;
			return retryCount > maxRetries ? 240000 : retryInterval * 1000;
		}
	}
}
