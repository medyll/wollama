import { writable } from 'svelte/store';
import { defaultOllamaSettings, defaultOptions } from '../../configuration/configuration';

import type { SettingsType } from '$types/settings';

const settingStore = () => {
	const isBrowser = typeof window !== 'undefined';
	const { subscribe, set, update } = writable<Partial<SettingsType>>({
		...defaultOptions,
		llamaOptions: defaultOllamaSettings
	});

	let currentStore = {} as Partial<SettingsType>;
	let dataStoreTimer: NodeJS.Timeout;

	subscribe((o) => {
		currentStore = o;
		storeData();
	});

	function storeData() {
		clearTimeout(dataStoreTimer);
		dataStoreTimer = setTimeout(() => {
			 localStorage.settings = JSON.stringify(currentStore);
			 localStorage.theme = currentStore.theme;
		}, 500);
	}

	isBrowser && localStorage.settings && set(JSON.parse(localStorage.settings));

	function setParameterValue(key: keyof SettingsType, value: any) {
		update((n) => {
			const newSettings = { ...n, [key]: value };
			return newSettings;
		});
	}

	return {
		subscribe,
		set,
		update,
		setParameterValue
	};
};

export const settings = settingStore();

export const showSettings = writable<boolean>(false);
