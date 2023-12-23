import { connectionChecker } from '$lib/stores/connection';
import { settings } from '$lib/stores/settings';
import { get } from 'svelte/store';
import { ApiCall } from './apiCall';
import { goto } from '$app/navigation';

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

	public static resolveDotPath(
		object: Record<string, any>,
		path: string,
		defaultValue?: any
	): any | undefined {
		return path.split('.').reduce((r, s) => (r ? r[s] : defaultValue), object) ?? undefined;
	}

	public static async checkOllamaEndPoints(fn: () => any = () => {}) {
		const ollama_fetch = new ApiCall();

		connectionChecker.setConnectionStatus('connecting');

		await ollama_fetch
			.listModels()
			.then(() => {
				connectionChecker.setConnectionStatus('connected');
				connectionChecker.setKey('connectionRetryCount', 0);
			})
			.catch((error) => {
				connectionChecker.incrementConnectionRetryCount();
				connectionChecker.setConnectionStatus('error');
			})
			.finally(() => {
				if (
					connectionChecker.get('connectionStatus') != 'connected' &&
					connectionChecker.get('connectionRetryTimeout') != 0
				) {
					ollamaCheckRetries = setTimeout(
						() => this.checkOllamaEndPoints(fn),
						connectionChecker.get('connectionRetryTimeout')
					);
				}
			});

		function getRetryTimeOut(retryCount: number, maxRetries?: number = 50) {
			let retryInterval = retryCount * 1.5;
			return retryCount > maxRetries ? 240000 : retryInterval * 1000;
		}
	}
}
