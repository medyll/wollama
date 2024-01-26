import { idbQuery } from '$lib/db/dbQuery';
import type { DBMessage, DbChat, MessageImageType, PromptType } from '$types/db';
import { OllChatMessageRole, type OllChatMessage, type OllResponseType } from '$types/ollama';

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
    public previousMessages: DBMessage[] = [];

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

    /**
     * Sets the previous messages for the chat.
     * transforms the array of DbMessages to an array of OllChatMessage
     * @returns A promise that resolves when the previous messages are set.
     */
    private async setPreviousMessages(): Promise<Partial<DBMessage>[]> {
        await idbQuery.getMessages(this.chat.chatId).then(
            (chatList) =>
                (this.previousMessages = chatList.map((e) => ({
                    content: e.content,
                    role: e.role,
                    images: e?.images?.base64,
                })))
        );
        return this.previousMessages;
    }

    /**
     *
     * @param content  - The content of the message.
     * @param images MessageImageType - Optional images to be attached to the message.
     */
    public async createSessionMessages(content: string, images?: MessageImageType) {
        await this.createUserMessage(content, images);
        await this.createAssistantMessage();
        await this.setPreviousMessages();
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
            images,
            role: 'user',
            status: 'done',
            //
            model: this.chat.models[0],
        });
        // format message for chat send
        this.userChatMessage = {
            prompt: content,
            role: OllChatMessageRole.USER,
            images: images?.base64 ? [images?.base64] : undefined,
        };
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
