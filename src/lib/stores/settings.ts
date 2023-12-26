import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
	OllamaOptionsDefaults,
	defaultOllamaSettings,
	defaultOptions
} from '../../configuration/configuration';

import type { SettingsType } from '$types/settings';
import type { OllamaOptionsType } from '$types/ollama';


// set to indexedDB
const settingStore = () => {
	const { subscribe, set, update } = writable<SettingsType>({
		...defaultOptions,
		ollamaOptions: defaultOllamaSettings
	} as SettingsType);

	let currentStore = {} as SettingsType;
	let dataStoreTimer: NodeJS.Timeout;

	subscribe((o) => {
		currentStore = o;
		storeData();
	});

	function initSettings() {
		if (browser) {
			const defaultOptions: OllamaOptionsType = Object.keys(OllamaOptionsDefaults).reduce(
				(acc, key) => {
					acc[key] = OllamaOptionsDefaults[key].default;
					return acc;
				},
				{}
			);

			const actualSettings = JSON.parse(localStorage.getItem('settings') ?? "{}");
			set({ ...defaultOptions, ...actualSettings });
		}
	}

	function storeData() {
		clearTimeout(dataStoreTimer);
		dataStoreTimer = setTimeout(() => {
			if (browser) {
				localStorage.settings = JSON.stringify(currentStore);
				localStorage.theme = currentStore.theme;
			}
		}, 500);
	}

	 initSettings();

	function setSetting(key: keyof SettingsType, value: any) {
		update((n) => {
			const newSettings = { ...n, [key]: value };
			return newSettings;
		});
	}

	return {
		subscribe,
		set,
		update,
		setSetting
	};
};

export const settings = settingStore();

export const showSettings = writable<boolean>(false);
