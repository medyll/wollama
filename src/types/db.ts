import type { OllamaOptionsType, OllamaResponseType } from './ollama';

/**
 * Represents a chat.
 */
export type ChatType = {
	id: string;
	chatId: string;
	title: string;
	models: string[];
	messages: MessageListType; /** @deprecated */
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
	images?: MessageImageType[];
	status: 'done' | 'sent' | 'streaming' | 'error';
	context: number[];
} & ({
			role: 'user';
	  } | {
			role: 'assistant';
			model?: string;
	  });

export type MessageListType = {
	[key: string]: MessageType;
};

export type MessageImageType = {
	name: string;
	type: string;
	header: string;
	base64: string;
};
