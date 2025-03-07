import { writable } from 'svelte/store';

type ConnectionStoreType = {
	connectionRetryCount:       number;
	connectionStatus:           'connected' | 'error' | 'connecting';
	connectionRetryTimeout:     number;
	connectionRemainingSeconds: number;
	subscribed?:                boolean;
};

export function connectionStore() {
	const { subscribe, set, update } = writable<ConnectionStoreType>({
		connectionRemainingSeconds: 0,
		connectionRetryCount:       0,
		connectionRetryTimeout:     0,
		connectionStatus:           'connecting',
		subscribed:                 false
	} as ConnectionStoreType);

	let currentStore = {} as ConnectionStoreType;

	let timer: NodeJS.Timeout;
	let start = 0;

	subscribe((state) => {
		if (!state?.subscribed) {
			update((n) => ({ ...n, subscribed: true, connectionRemainingSeconds: 0 }));
			clearTimeout(timer);
			start = 0; // reset timer
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
		get:                           (key: keyof ConnectionStoreType) => currentStore[key],
		incrementConnectionRetryCount: () => update((state) => ({ ...state, connectionRetryCount: state.connectionRetryCount + 1 })),
		set,
		setConnectionStatus:           (status: ConnectionStoreType['connectionStatus']) =>
			update((state) => ({ ...state, connectionStatus: status })),
		setKey:                        (key: keyof ConnectionStoreType, value: any) => update((state) => ({ ...state, [key]: value })),
		subscribe,
		update
	};
}

export const connectionChecker = connectionStore();
