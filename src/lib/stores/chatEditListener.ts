import { derived, writable } from 'svelte/store';

export const aiResponseState = writable<'running' | 'done'>('done');

function chatEditListenerStore() {
	const { subscribe, set, update } = writable<{ isTyping: boolean }>({ isTyping: false });

	let timer: NodeJS.Timeout;

	subscribe((o) => {

		clearTimeout(timer);
		timer = setTimeout(() => {
            if(o.isTyping)set({isTyping: false})
		}, 1000);
	});

	return {
		subscribe,
		set,
		update,
		setEvent: () => update((n) => ({ ...n, isTyping: true }))
	};
}

export const chatEditListener = chatEditListenerStore();
