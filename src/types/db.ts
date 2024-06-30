import type { OllamaChat, OllamaOptions, OllamaResponse } from './ollama';

/**
 * Represents a chat.
 */
export type DbChat = {
    id: string;
    chatId: string;
    categoryId: number;
    title: string;
    description: string;
    models: string[];
    createdAt: Date;
    category: string;
    dateLastMessage: Date;
    tags: DbTags[];
    systemPrompt: PromptType;
    /** @deprecated find in ollamaBody */ context: number[];
    ollamaBody: Partial<OllamaChat>;
};
export type DbCategory = {
    id: number;
    name: string;
    code: string;
};
export type DbTags = {
    id: number;
    name: string;
    code: string;
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
    /** @deprecated */
    messageId: string;
    content: string;
    createdAt: Date;
    images?: MessageImageType;
    status: 'idle' | 'done' | 'sent' | 'streaming' | 'error';
    context: number[];
    resume: string;
    model: string;
    urls?: { url: string; image?: string; order: number; title?: string }[];
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
