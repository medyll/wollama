import { writable } from 'svelte/store';

type ConnectionStoreType = {
	connectionRetryCount: number;
	connectionStatus: 'connected' | 'error' | 'connecting';
	connectionRetryTimeout: number;
	connectionRemainingSeconds: number;
};

export function connectionStore() {
	const { subscribe, set, update } = writable<ConnectionStoreType>({
		connectionStatus: 'connecting',
		connectionRetryCount: 0,
		connectionRetryTimeout: 0,
		connectionRemainingSeconds: 0
	} as ConnectionStoreType);

	let currentStore = {} as ConnectionStoreType;

	let timer: NodeJS.Timeout;
	let start = 0;

	subscribe((state) => {
		if (state.connectionStatus == 'connecting' && state.connectionRemainingSeconds != 0) {
            start = 0; // reset timer
            update((n) => ({ ...n, connectionRemainingSeconds: 0 }));
        }
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
		setKey: (key: keyof ConnectionStoreType, value: any) => update((state) => ({ ...state, [key]: value })),
		get: (key: keyof ConnectionStoreType) => currentStore[key],
		setConnectionStatus: (status: ConnectionStoreType['connectionStatus']) =>
			update((state) => ({ ...state, connectionStatus: status })),
		incrementConnectionRetryCount: () =>
			update((state) => ({ ...state, connectionRetryCount: state.connectionRetryCount + 1 }))
	};
}

export const connectionChecker = connectionStore();
