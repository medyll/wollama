import { writable } from 'svelte/store';

type UiStoreType = {
	autoScroll: {
		[chatId: string]: boolean;
	};
};
const defaultUiStoreOptions: UiStoreType = {
	autoScroll: {}
};

const uiStore = () => {
	const { set, update, subscribe } = writable(defaultUiStoreOptions);

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
		setParameterValue: <T = UiStoreType>(key: keyof T, value: typeof key) =>
			update((state) => ({ ...state, [key]: value }))
	};
};

export const ui = uiStore();
