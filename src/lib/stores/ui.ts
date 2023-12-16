import { writable } from 'svelte/store';

type UiStoreType = {
	activeChatId?: string;
	autoScroll: {
		[chatId: string]: boolean;
	};
};
const defaultUiStoreOptions: UiStoreType = {
	autoScroll: {}
};

const uiStore = () => {
	const { set, update, subscribe } = writable(defaultUiStoreOptions);

	function setActiveChatId (chatId: string) {
		return update((state) => ({ ...state, activeChatId: chatId }));
	}
	function setAutoScroll(chatId: string, scroll: boolean) {
		return update((state) => ({
			...state,
			autoScroll: {
				...state.autoScroll,
				[chatId]: scroll
			}
		}));
	}

	return {
		set,
		update,
		subscribe,
		setAutoScroll,
		setActiveChatId,
		setParameterValue: <T = UiStoreType>(key: keyof T, value: typeof key) =>
			update((state) => ({ ...state, [key]: value }))
	};
};

export const ui = uiStore();
