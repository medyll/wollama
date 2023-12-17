import type { MessageListType } from "$lib/stores/messages";

/**
 * Represents a chat.
 */
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

/**
 * Represents a list of chats.
 */
export interface ChatListType {
	[key: string]: ChatDataType;
}