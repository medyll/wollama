import { get, writable } from 'svelte/store';

export type NotifyStatus = 'success' | 'error' | 'warning' | 'info';
export type NotificationType = {
	id: string;
	status?: NotifyStatus;
	message?: string;
};
export type NotificationsType = Record<string, NotificationType>;

function notifierStateStore() {
	const store = writable<NotificationsType>([]);

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		notify(status: NotifyStatus = 'info', message: string, nId?: any) {
			const id = nId ?? crypto.randomUUID();
			store.set({ ...get(store), [id]: { id, status, message } });
		},
		delete(id: string) {
			const ne = get(store);
			delete ne[id];
			store.set(ne);
		}
	};
}

export const notifierState = notifierStateStore();
