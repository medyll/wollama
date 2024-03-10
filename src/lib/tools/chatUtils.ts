import type { DbChat } from '$types/db';
import type { DBMessage } from '$types/db';
import { get } from 'svelte/store';
import { OllamaApi } from '../db/ollamaApi';
import { settings } from '$lib/stores/settings.svelte';
import { idbQuery } from '$lib/db/dbQuery';
import type { OllApiGenerate, OllamaResponse } from '$types/ollama';
import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';

export async function askOllama(prompt: string, model: string) {}

export async function guessChatTitle(message: string): Promise<OllamaResponse> {
    const config = get(settings);
    const ollamaOptions = get(ollamaApiMainOptionsParams);
    //
    const prompt = `You are an automated system. Not a chat agent. You don't drive conversations, but obey orders.
    Your role is to Generate a very short title from chat conversations. 
    The title will resume the topic, the subject or the category of the conversation.
    create the  title a human friendly way.
    create the title with the category and general topic of the conversation.
    The created title should be very short.The title should not be too long.
    Don't   write the word title. Don't say thank you.
    Don't say hello, only return the created title. don't talk, don't say things like "sure, here is the stuff".
    Don not put the title in quotes or double quotes.    
    Do not explain the task or the program.
    Reply with not less then 2 words and no more than five words, it's mandatory
    Here is the conversation to resume very shortly, not less then 2 words and no more than five words :
    ${message}`;

    const defaultOptions = {
        model: config?.defaultModel,
        system: config?.system_prompt,
        prompt,
        stream: false,
        options: { ...ollamaOptions },
    } as OllApiGenerate;

    return await OllamaApi.generate(defaultOptions, () => {});
}

export class chatUtils {
    static async checkTitle(chatId: string) {
        const chat = await idbQuery.getChat(chatId);
        const chatMessages = await idbQuery.getMessages(chatId);

        //if (!chat?.title || chat?.title === 'New Chat') {
        //if (chatMessages.length > 2 && chatMessages.length < 4) {
        const resume = chatMessages
            .slice(0, 6)
            .map((message: DBMessage) => message.content)
            .join('\n\n\n-------\n\n\n');

        const res = await guessChatTitle(resume);
        console.log(res);

        if (res?.response !== '') idbQuery.updateChat(chatId, { title: res.response });
        //}
        // }
    }

    static getMessageDataObject(message: Partial<DBMessage>): DBMessage {
        return {
            content: message.content,
            createdAt: new Date(),
            data: [],
            edit: false,
            editedContent: '',
            messageId: crypto.randomUUID(),
            role: message.role,
            ...message,
        };
    }

    static getChatDataObject(chatData: DbChat = {} as DbChat): DbChat {
        return {
            chatId: crypto.randomUUID(),
            context: [],
            createdAt: new Date(),
            dateLastMessage: new Date(),
            models: [get(settings).defaultModel],
            title: 'New Chat',
            ...chatData,
        };
    }

    static getMessageStatsObject(messageData: Partial<OllamaResponse>): OllamaResponse {
        return {
            messageId: crypto.randomUUID(),
            ...messageData,
        };
    }
}
