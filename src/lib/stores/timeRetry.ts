import type { get } from 'http';
import { writable } from 'svelte/store';

type UiStoreType = {
	connectionRetryCount: number;
	connectionStatus: 'connected' | 'error' | 'connecting';
	connectionRetryTimeout: number;
	connectionRemainingSeconds: number;
};

export function timeRetryStore() {
	const { subscribe, set, update } = writable<UiStoreType>({
		connectionStatus: 'connecting',
		connectionRetryCount: 0,
		connectionRetryTimeout: 0,
		connectionRemainingSeconds: 0
	} as UiStoreType);

	let currentStore = {} as UiStoreType;

	let timer: NodeJS.Timeout;
	let start = 0;

	subscribe((state) => {
		if (state.connectionStatus == 'connecting') start = 0;
		if (state.connectionStatus == 'error') {
			if (state.connectionRetryTimeout != state.connectionRetryCount * 4000) {
				update((n) => ({ ...n, connectionRetryTimeout: n.connectionRetryCount * 4000 }));
			}
			clearTimeout(timer);
			timer = setTimeout(() => {
				update((n) => ({
					...n,
					connectionRemainingSeconds: currentStore.connectionRetryTimeout / 1000 - start
				}));
				start++;
			}, 1000);
		}

		currentStore = state;
	});

	return {
		subscribe,
		set,
		update,
		setParameterValue: (key: keyof UiStoreType, value: any) =>
			update((state) => ({ ...state, [key]: value })),
		get: (key: keyof UiStoreType) => currentStore[key],
		setConnectionStatus: (status: UiStoreType['connectionStatus']) =>
			update((state) => ({ ...state, connectionStatus: status })),
		incrementConnectionRetryCount: () =>
			update((state) => ({ ...state, connectionRetryCount: state.connectionRetryCount + 1 }))
	};
}

export const timeRetry = timeRetryStore();
