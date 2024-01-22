import { idbQuery } from '$lib/db/dbQuery';
import type { DBMessage, DbChat, MessageImageType } from '$types/db';
import type { OllChatMessage, OllResponseType } from '$types/ollama';
import { engine } from './engine';

export class ChatSession {
    private chatId!: DbChat['chatId'] | undefined;
    public chat!: DbChat;
    public assistants!: DBMessage[];
    public user!: DBMessage;
    public userMessage!: OllChatMessage;

    constructor(chatId: string | undefined) {
        this.chatId = chatId;
    }
    // retrieve or set a chat session
    async setChatData(chatData: Partial<DbChat> = {} as DbChat) {
        this.chat = await idbQuery.initChat(this.chatId, chatData as DbChat);
        await this.createAssistantMessage();
    }

    // add messages chat to db
    public async createUserMessages(content: string, images?: MessageImageType) {
        this.user = await idbQuery.insertMessage(this.chat.chatId, {
            chatId: this.chat.chatId,
            content,
            images: images,
            role: 'user',
            status: 'done',
        });

        // format message for send
        this.userMessage = engine.translateKeys<DBMessage, OllChatMessage>(this.user, {
            content: 'prompt',
            role: 'role',
            'images.base64': 'images',
        });
    }

    public async onMessageDone(assistantMessage: DBMessage, data: OllResponseType) {
        await Promise.all([
            idbQuery.updateChat(this.chat.chatId, { context: data.context }),
            idbQuery.updateMessage(assistantMessage.messageId, { status: 'done' }),
            idbQuery.insertMessageStats({ ...data, messageId: assistantMessage.messageId }),
        ]);
    }

    public async onMessageStream(assistantMessage: DBMessage, data: OllResponseType) {
        idbQuery.updateMessageStream(assistantMessage.messageId, data);
    }

    private async createAssistantMessage() {
        this.assistants = await Promise.all([
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

        return this.assistants;
    }
}
