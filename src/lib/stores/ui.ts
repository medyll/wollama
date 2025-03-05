import { writable } from 'svelte/store';

type UiStoreType = {
	showSettings?: boolean;
	showPrompt?:   boolean;
	showMenu:      boolean;
	activeChatId?: string;
	searchString?: string;
	pullStatus?:   {
		status:    string;
		completed: number;
		total:     number;
		error?:    string;
		digest?:   string;
	};
	autoScroll:    {
		[chatId: string]: boolean;
	};
};
const defaultUiStoreOptions: UiStoreType = {
	autoScroll:   {},
	searchString: undefined,
	showMenu:     false,
	showPrompt:   false,
	showSettings: false
};

const uiStore = () => {
	const { set, update, subscribe } = writable(defaultUiStoreOptions);

	function setActiveChatId(chatId?: string) {
		return update((state) => ({ ...state, activeChatId: chatId }));
	}
	function showHideSettings() {
		return update((state) => ({ ...state, showSettings: !state.showSettings }));
	}
	function showHideMenu(val?: boolean) {
		return update((state) => ({ ...state, showMenu: val ?? !state.showMenu }));
	}
	function showHidePromptMenu(val?: boolean) {
		return update((state) => ({ ...state, showPrompt: val ?? !state.showPrompt }));
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
		setActiveChatId,
		setAutoScroll,
		setParameterValue: <T = UiStoreType>(key: keyof T, value: typeof key) =>
			update((state) => ({ ...state, [key]: value })),
		showHideMenu,
		showHidePromptMenu,
		showHideSettings,
		subscribe,
		update
	};
};

export const ui = uiStore();
