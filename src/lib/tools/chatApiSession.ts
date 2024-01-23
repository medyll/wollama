import { idbQuery } from '$lib/db/dbQuery';
import type { DBMessage, DbChat, MessageImageType, PromptType } from '$types/db';
import type { OllChatMessage, OllResponseType } from '$types/ollama';
import { engine } from './engine';

/**
 * Represents a class that manages a chat session.
 * using api/chat endpoint
 * @class ChatApiSession
 * @property {DbChat} chat - The chat object.
 * @property {DBMessage[]} assistantsDbMessages - The assistant messages.
 * @property {DBMessage} userDbMessage - The user message.
 * @property {OllChatMessage} userChatMessage - The user message formatted for sending.
 */
export class ChatApiSession {
    public chat!: DbChat;
    public assistantsDbMessages!: DBMessage[];
    public userDbMessage!: DBMessage;
    public userChatMessage!: OllChatMessage;
    public options: {
        systemPrompt?: PromptType;
        context?: number[];
    } = {};

    private chatId!: DbChat['chatId'] | undefined;

    /**
     * Creates a new ChatSession instance.
     * @param chatId The ID of the chat.
     * @param chatSessionType The type of chat session for the api call.
     */
    constructor(chatId: string | undefined) {
        this.chatId = chatId;
    }

    /**
     * Sets the chat data for the chat session.
     * @param chatData - The partial chat data to set.
     * @returns A promise that resolves when the chat data is set.
     */
    public async initChatSession(chatData: Partial<DbChat> = {} as DbChat) {
        this.chat = await idbQuery.initChat(this.chatId, chatData as DbChat);
    }

    public async setOptions(options: ChatApiSession['options']): Promise<any> {
        this.options = options;
        await this.setApiChatOptions(options);
    }

    /**
     * Options setter for mode api/chat
     * @param options  - The chat options to set.
     */
    private async setApiChatOptions(options: ChatApiSession['options']) {
        if (this.chatSessionType !== 'chat') return;
        if (options?.systemPrompt?.content) {
            // the system prompt can change during the chat session
            const messages = await idbQuery.getMessages(this.chat.chatId);
            const lastSystemMessage = messages.reverse().find((e) => e.role === 'system');
            // find the last message of type 'system'
            if (lastSystemMessage?.content != options?.systemPrompt?.content) {
                // if the last system message is different from the new one
                await idbQuery.insertMessage(this.chat.chatId, {
                    chatId: this.chat.chatId,
                    prompt: options.systemPrompt.content,
                    content: options.systemPrompt.content,
                    role: 'system',
                    status: 'done',
                });
            }
        }
    }

    /**
     *
     * @param content  - The content of the message.
     * @param images MessageImageType - Optional images to be attached to the message.
     */
    public async createSessionMessages(content: string, images?: MessageImageType) {
        await this.createUserMessage(content, images);
        await this.createAssistantMessage();
    }
    /**
     * Creates a user message in the chat session.
     *
     * @param content - The content of the message.
     * @param images - Optional images to be attached to the message.
     * @returns A Promise that resolves to the created user message.
     */
    private async createUserMessage(content: string, images?: MessageImageType) {
        this.userDbMessage = await idbQuery.insertMessage(this.chat.chatId, {
            chatId: this.chat.chatId,
            content,
            images: images,
            role: 'user',
            status: 'done',
            //
            model: this.chat.models[0],
        });
        // format message for chat send
        this.userChatMessage = engine.translateKeys<DBMessage, OllChatMessage>(this.userDbMessage, {
            content: 'prompt',
            role: 'role',
            'images.base64': 'images',
        });
    }

    private async createAssistantMessage() {
        this.assistantsDbMessages = await Promise.all([
            ...this.chat.models.map(
                async (model) =>
                    await idbQuery.insertMessage(this.chat.chatId, {
                        chatId: this.chat.chatId,
                        model,
                        role: 'assistant',
                        status: 'idle',
                    })
            ),
        ]);

        return this.assistantsDbMessages;
    }

    /**
     * Handles the completion of a message in the chat session.
     * @param assistantMessage - The assistant message object.
     * @param data - The response data from the assistant.
     */
    public async onMessageDone(assistantMessage: DBMessage, data: OllResponseType) {
        await Promise.all([
            idbQuery.updateChat(this.chat.chatId, { context: data.context }),
            idbQuery.updateMessage(assistantMessage.messageId, { status: 'done' }),
            idbQuery.insertMessageStats({ ...data, messageId: assistantMessage.messageId }),
        ]);
    }

    /**
     * Handles the incoming message stream from the assistant.
     * @param assistantMessage - The message object received from the assistant.
     * @param data - The response data received from the assistant.
     */
    public async onMessageStream(assistantMessage: DBMessage, data: OllResponseType) {
        idbQuery.updateMessageStream(assistantMessage.messageId, data);
    }
}
