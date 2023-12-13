import { connectionChecker } from '$lib/stores/connection';
import { settings } from '$lib/stores/settings';
import { timeRetry } from '$lib/stores/timeRetry';
import { OllamaFetch } from './ollamaFetch';

let ollamaCheckRetries = 0;
let raminingTimer = 0;
export class engine {
	public static setTheme(theme: string) {
		settings.setParameterValue('theme', theme);
		const currentTheme = theme == 'light' ? 'dark' : 'light';

		if (document?.documentElement) {
			document.documentElement.classList.replace(currentTheme, theme);
		}
	}

	public static async checkOllamaEndPoints(fn: () => any = () => {}) {
		const ollama_fetch = new OllamaFetch();

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
