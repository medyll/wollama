import { get, writable } from 'svelte/store';

export type NotifyStatus = 'success' | 'error' | 'warning' | 'info';
export type NotificationType = {
	id:       string;
	status?:  NotifyStatus;
	message?: string;
};
export type NotificationsType = Record<string, NotificationType>;

function notifierStateStore() {
	const store = writable<NotificationsType>([]);

	return {
		delete(id: string) {
			const ne = get(store);
			delete ne[id];
			store.set(ne);
		},
		notify(status: NotifyStatus = 'info', message: string, nId?: any) {
			const id = nId ?? crypto.randomUUID();
			if (get(store)[id]?.status !== status)
				store.set({ ...get(store), [id]: { id, message, status } });
		},
		set:       store.set,
		subscribe: store.subscribe,
		update:    store.update
	};
}

export const notifierState = notifierStateStore();
