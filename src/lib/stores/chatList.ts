import { writable } from 'svelte/store';
import type { MessageList as MessageListType, MessageType } from './messages';

export type ChatType = {
	id: string;
	title: string;
	models: string[];
	messages: MessageListType;
};
export interface ChatListType {
	[key: string]: ChatType;
}

 
export const activeChatId = writable<string | undefined>();

/**
 * Creates a chat list store.
 * @returns An object with methods to subscribe, set, and update the chat list.
 */
function chatListStore() {
	const isBrowser = typeof window !== 'undefined';
	const { subscribe, set, update } = writable<ChatListType>({});

	let currentStore = {} as ChatListType;
	let dataStoreTimer: NodeJS.Timeout;

	subscribe((o) => {
		currentStore = o;
		storeData();
	});

	function storeData() {
		clearTimeout(dataStoreTimer);
		dataStoreTimer = setTimeout(() => {
			localStorage.chatList = JSON.stringify(currentStore);
		}, 500);
	}

	isBrowser && localStorage.chatList && set(JSON.parse(localStorage.chatList));

	return {
		subscribe,
		set,
		update,
		getChat: (chatId: string) => currentStore?.[chatId],
		setChat: (newChat: ChatType) => update((n) => ({ ...n, [newChat.id]: newChat })),
		getChatMessages: (chatId: string) => currentStore?.[chatId]?.messages ?? {},
		updateChat: (chatId: string, chatData: ChatType) => {
			update((n) => {
				const currentChat = n[chatId];
				const newChat = { ...currentChat, ...chatData };
				return { ...n, [chatId]: newChat };
			});
		},
		createChatMessage: (chatId: string, message: MessageType) =>
			update((n) => {
				const newChat = {
					...n[chatId],
					messages: { ...n[chatId]?.messages, [message.id]: message }
				};
				return { ...n, [chatId]: newChat };
			}),
		getChatMessage: (chatId: string, messageId: string) => {
			return currentStore?.[chatId]?.messages?.[messageId];
		},
		updateChatMessage: (chatId: string, message: MessageType) =>
			update((n) => {
				const currentMessage = n[chatId]?.messages[message.id];
				const newMessage = { ...currentMessage, ...message };
				const newChat = {
					...n[chatId],
					messages: { ...n[chatId]?.messages, [message.id]: newMessage }
				};
				return { ...n, [chatId]: newChat };
			})
	};
}
export const chatList = chatListStore();
