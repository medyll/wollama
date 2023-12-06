import { writable } from 'svelte/store';

export type MessageType = {
	id: string;
	edit: boolean;
	editedContent: string;
	parentId: string;
	childrenIds: string[];
	content: string;
	role: 'user' | 'assistant';
};

export type MessageList = {
	[key: string]: MessageType;
};
export const messageList = writable<MessageList>({}); 
