import { derived, get, writable } from 'svelte/store';
import type { MessageListType, MessageType } from './messages';
import type { OllamaStreamLineLast } from '$lib/tools/ollamaFetch';

// Chat element
export type ChatDataType = {
	id: string;
	chatId: string;
	title: string;
	models: string[];
	messages: MessageListType;
	dateCreation: Date;
	dateLastMessage: Date;
	context: number[];
	temperature: number;
};

// Object list of chat elements
export interface ChatListType {
	[key: string]: ChatDataType;
}

export const activeChatId = writable<string | undefined>();
export const chatter = chatListStore();
/**
 * Creates a chat list store.
 * @returns An object with methods to subscribe, set, and update the chat list.
 */
function chatListStore() {
	const isBrowser = typeof window !== 'undefined';
	const store = writable<ChatListType>({});

	let currentStore = {} as ChatListType;
	let dataStoreTimer: NodeJS.Timeout;

	store.subscribe((o) => {
		currentStore = o;
		storeData();
	});

	function storeData() {
		clearTimeout(dataStoreTimer);
		dataStoreTimer = setTimeout(() => {
			//localStorage.chatList = JSON.stringify(currentStore);
		}, 500);
	}

	//isBrowser && localStorage?.chatList && store.set(JSON.parse(localStorage.chatList));

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		getChat: (chatId?: string) => (chatId ? get(store)[chatId] : undefined),
		insertChat: (newChat: ChatDataType) => {
			store.update((n) => ({ ...n, [newChat.id]: newChat }));
		},
		getChatMessages: (chatId: string) => currentStore?.[chatId]?.messages ?? {},
		updateChat: (chatId: string, chatData: Partial<ChatDataType>) => {
			store.update((n) => {
				const currentChat = n[chatId];
				const newChat = { ...currentChat, ...chatData };
				return { ...n, [chatId]: newChat };
			});
		},
		addChatModel: (chatId: string, model: string) => {
			store.update((n) => {
				const currentChat = n[chatId];
				const currentModels = n[chatId].models;
				const newChat = { ...currentChat, models: [...currentModels, model] };
				return { ...n, [chatId]: newChat };
			});
		},
		insertMessage: (chatId: string, message: Partial<MessageType>) =>
			store.update((n) => {
				const newChat = {
					...n[chatId],
					messages: { ...n[chatId]?.messages, [message.id]: message }
				};
				return { ...n, [chatId]: newChat };
			}),
		getChatMessage: (chatId: string, messageId: string) => {
			return currentStore?.[chatId]?.messages?.[messageId];
		},
		updateChatMessage: (chatId: string, message: Partial<MessageType>) =>
			store.update((n) => {
				const currentMessage = n[chatId]?.messages[message.id];
				const newMessage = { ...currentMessage, ...message };
				const newChat = {
					...n[chatId],
					messages: { ...n[chatId]?.messages, [message.id]: newMessage }
				};
				return { ...n, [chatId]: newChat };
			}),
		updateChatMessageData: (
			chatId: string,
			messageId: string,
			data: Partial<OllamaStreamLineLast>
		) => {
			store.update((n) => {
				const currentData = n[chatId]?.messages?.[messageId]?.data;
				const newChat = {
					...n[chatId],
					messages: {
						...n[chatId]?.messages,
						[messageId]: {
							...n[chatId]?.messages?.[messageId],
							data: { ...currentData, ...data }
						}
					}
				};
				return { ...n, [chatId]: newChat };
			});
		},

		getLastMessageContext: (chatId: string) => {
			const messages = currentStore?.[chatId]?.messages;
			const lastMessage = Object.values(messages)
				.filter((x) => x.role === 'assistant')
				.pop();
			return lastMessage?.context;
		}
	};
}

// activeChat derived from chatter
export const activeChat = derived([chatter, activeChatId], ([$chatter, $activeChatId]) =>
	$activeChatId ? $chatter?.[$activeChatId] : undefined
);
