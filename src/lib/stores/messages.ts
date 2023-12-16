import type { OllamaStreamLine } from '$lib/tools/ollamaFetch';
import { writable } from 'svelte/store';

export type MessageType = {
	id: string;
	chatId: string;
	messageId: string;
	edit: boolean;
	editedContent: string;
	content: string;
	role: 'user' | 'assistant';
	context: number[];
	data: OllamaStreamLine;
};

export type MessageListType = {
	[key: string]: MessageType;
};
