import { settings } from '$lib/stores/settings';
import { ui } from '$lib/stores/ui';
import { OllamaFetch } from './ollamaFetch';

let ollamaCheckTimer: NodeJS.Timeout;
export class engine {
	public static setTheme(theme: string) {
		settings.setParameterValue('theme', theme);
		const currentTheme = theme == 'light' ? 'dark' : 'light';

		if (document?.documentElement) {
			document.documentElement.classList.replace(currentTheme, theme);
		}
	}

	public static async checkOllamaEndPoints(fn: () => any) {
		const ollama_fetch = new OllamaFetch(); 

        ui.setConnectionStatus('connecting');
		await fetchModels();
        setTimeout(this.checkOllamaEndPoints,10000)

		async function fetchModels() {
			return ollama_fetch
				.listModels()
				.then((res) => {
					ui.setConnectionStatus('connected');
				})
				.catch((error) => {
					console.log('erreor,', error);
					ui.setConnectionStatus('error');
				});
		}
	}
}
