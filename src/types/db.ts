import type { OllamaApiBody, OllamaOptionsType, OllamaResponseType } from './ollama';

/**
 * Represents a chat.
 */
export type ChatType = {
	id: string;
	chatId: string;
	title: string;
	models: string[];
	createdAt: Date;
	dateLastMessage: Date;
	context: number[] /** @deprecated find in ollamaBody */;
	ollamaBody: Partial<OllamaApiBody>;
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
	createdAt: Date;
	images?: MessageImageType;
	status: 'idle' | 'done' | 'sent' | 'streaming' | 'error';
	context: number[];
	model: string;
} & (
	| {
			role: 'user';
	  }
	| {
			role: 'assistant';
			model?: string;
	  }
);

export type MessageListType = {
	[key: string]: MessageType;
};

export type MessageImageType = {
	name: string;
	type: string;
	dataUri: string;
	header: string;
	base64: string;
};


export type PromptType = {
	id: number;
	createdAt: Date;
	content: string;
	title: string;
}