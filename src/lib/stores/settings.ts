import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { defaultOllamaSettings, defaultOptions } from '../../configuration/configuration';

import type { SettingsType } from '$types/settings';

const settingStore = () => {
	const isBrowser = typeof window !== 'undefined';
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

	function storeData() {
		clearTimeout(dataStoreTimer);
		dataStoreTimer = setTimeout(() => {
			if (browser) {
				localStorage.settings = JSON.stringify(currentStore);
				localStorage.theme = currentStore.theme;
			}
		}, 500);
	}

	isBrowser && localStorage.settings && set(JSON.parse(localStorage.settings));

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
