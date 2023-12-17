import type { OllamaOptionsType, OllamaResponseType } from './ollama';

/**
 * Represents a chat.
 */
export type ChatType = {
	id: string;
	chatId: string;
	title: string;
	models: string[];
	messages: MessageListType;
	dateCreation: Date;
	dateLastMessage: Date;
	context: number[];
	images: string[] /** @deprecated */;
	temperature: number /** @deprecated */;
	options: OllamaOptionsType;
};

/**
 * Represents a list of chats.
 */
export interface ChatListType {
	[key: string]: ChatType;
}

export type MessageType = {
	id: string;
	chatId: string;
	messageId: string; 
	content: string;
	role: 'user' | 'assistant';
	context: number[];
	images?: MessageImageType[];
<<<<<<< HEAD
	status: 'done' | 'sent' | 'streaming' | 'error';
	data: OllamaResponseType ;/**@deprecated */
=======
	data: OllamaResponseType /**@deprecated */;
>>>>>>> 08fe1431484dc4ad54b825d42d4f527f5cfe740d
};

export type MessageListType = {
	[key: string]: MessageType;
};

export type MessageImageType = {
	name: string;
	type: string;
	header: string;
	base64: string;
};
