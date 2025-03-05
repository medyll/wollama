import { browser } from '$app/environment';
import { OllamaOptionsDefaults } from '$configuration/configuration';
import { type Options } from 'ollama/browser';
import { writable } from 'svelte/store';

function ollamaOptionStorage() {
	const store = writable<Options>({} as Options);

	store.subscribe((o) => {
		if (browser) {
			localStorage.ollamaOptions = JSON.stringify(o);
		}
	});

	function init(values: Partial<Options> = {}) {
		if (browser) {
			const storeOptions = JSON.parse(localStorage.getItem('ollamaOptions') ?? '{}');
			const options: Partial<Options> = Object.keys(
				OllamaOptionsDefaults as unknown as Options
			).reduce((acc: Partial<Options>, key) => {
				acc[key] = OllamaOptionsDefaults[key].default ?? null;
				return acc;
			}, {});

			store.set({ ...storeOptions, ...options, ...values });
		}
	}

	function resetParam(param: keyof Options) {
		store.update((n) => {
			const newSettings = {
				...n,
				[param]: OllamaOptionsDefaults[param].default ?? null
			};
			return newSettings;
		});
	}

	function resetAll() {
		localStorage.ollamaOptions = JSON.stringify({});
		const options: Options = Object.keys(OllamaOptionsDefaults).reduce(
			(acc: Partial<Options>, key) => {
				acc[key] = OllamaOptionsDefaults[key].default ?? null;
				return acc;
			},
			{}
		);
		store.set(options);
	}

	return {
		init,
		resetAll,
		resetParam,
		set:       store.set,
		setOption: (key: keyof Options, value: any) => {
			store.update((n) => {
				const newSettings = { ...n, [key]: value };
				return newSettings;
			});
		},
		subscribe: store.subscribe
	};
}

export const ollamaApiMainOptionsParams = ollamaOptionStorage();
