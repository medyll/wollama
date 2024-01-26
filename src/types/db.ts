import type { OllApiChat, OllOptionsType, OllResponseType } from './ollama';

/**
 * Represents a chat.
 */
export type DbChat = {
    id: string;
    chatId: string;
    title: string;
    models: string[];
    createdAt: Date;
    dateLastMessage: Date;
    systemPrompt: PromptType;
    /** @deprecated find in ollamaBody */ context: number[];
    ollamaBody: Partial<OllApiChat>;
};

/**
 * Represents a chat list type.
 */
export interface ChatListType {
    [key: string]: DbChat;
}

/**
 * Represents a message.
 */
export type DBMessage = {
    id: string;
    chatId: string;
    messageId: string;
    content: string;
    createdAt: Date;
    images?: MessageImageType;
    status: 'idle' | 'done' | 'sent' | 'streaming' | 'error';
    context: number[];
    model: string;
    role: 'system' | 'user';
} & (
    | {
          role: 'system';
      }
    | {
          role: 'user';
      }
    | {
          role: 'assistant';
          model?: string;
      }
);

export type DbMessageListType = {
    [key: string]: DBMessage;
};

export type MessageImageType = {
    name: string;
    type: string;
    dataUri: string;
    header: string;
    base64: string;
};

export type PromptType = {
    id: string;
    createdAt: Date;
    content: string;
    title: string;
};
