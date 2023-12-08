import { writable } from 'svelte/store';

export type MessageType = {
	id: string;
	chatId: string;
	edit: boolean;
	editedContent: string;
	parentId: string;
	content: string;
	role: 'user' | 'assistant';
	context: number[];
};

export type MessageListType = {
	[key: string]: MessageType;
};

export const messageList = writable<MessageListType>({}); 
