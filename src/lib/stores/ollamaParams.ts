import { browser } from '$app/environment';
import { OllamaOptionsDefaults } from '$configuration/configuration';
import type { OllamaOptionsType } from '$types/ollama';
import { writable } from 'svelte/store';

function ollamaOptionStoreBuild() {
	const store = writable<OllamaOptionsType>({} as OllamaOptionsType);

	store.subscribe((o) => {
		if (browser) {
			localStorage.ollamaOptions = JSON.stringify(o);
		}
	});

	function init(values: Partial<OllamaOptionsType> = {}) {
		if (browser) {
			const storeOptions = JSON.parse(localStorage.getItem('ollamaOptions') ?? '{}');
			const options: OllamaOptionsType = Object.keys(OllamaOptionsDefaults).reduce((acc: Partial<OllamaOptionsType>, key) => {
				acc[key] = OllamaOptionsDefaults[key].default ?? null;
				return acc;
			}, {});

			store.set({ ...storeOptions, ...options, ...values });
		}
	}

	function resetParam(param: keyof OllamaOptionsType) {
		store.update((n) => {
			const newSettings = { ...n, [param]: OllamaOptionsDefaults[param].default ?? null };
			return newSettings;
		});
	}

	function resetAll() {
		localStorage.ollamaOptions = JSON.stringify({});
		const options: OllamaOptionsType = Object.keys(OllamaOptionsDefaults).reduce((acc: Partial<OllamaOptionsType>, key) => {
			acc[key] = OllamaOptionsDefaults[key].default ?? null;
			return acc;
		}, {});
		store.set(options);
	}

	return {
		init,
		resetAll,
		resetParam,
		set: store.set,
		setOption: (key: keyof OllamaOptionsType, value: any) => {
			store.update((n) => {
				const newSettings = { ...n, [key]: value };
				return newSettings;
			});
		},
		subscribe: store.subscribe
	};
}

export const ollamaParams = ollamaOptionStoreBuild();
