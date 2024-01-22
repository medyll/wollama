import { idbQuery } from '$lib/db/dbQuery';
import { OllamaApi } from '$lib/db/ollamaApi';
import type { DBMessage } from '$types/db';
import type { OllChatMessage, OllCompletionBody, OllOptionsType, OllResponseType } from '$types/ollama';

export type PromptSenderType = {
    prompt: string;
    context: number[];
    models: string[];
    images?: string[];
    options: OllOptionsType;
    format: 'json' | 'plain' | '' | string;
};

export type SenderCallback<T> = {
    data: OllResponseType;
} & T;

type CallbackDataType = {
    assistantMessage: DBMessage;
};

export class PromptSender<T> {
    private chatId: string;
    private previousMessages: DBMessage[] = [];
    private ready: boolean = false;
    private body: OllCompletionBody;
    private assistantMessage!: DBMessage;

    onStream!: (args: SenderCallback<CallbackDataType>) => void;
    onEnd!: (args: SenderCallback<CallbackDataType>) => void;

    constructor(chatId: string, body: OllCompletionBody = {} as OllCompletionBody) {
        this.chatId = chatId;
        this.body = body;
        // retrieve all previous sent messages
        this.setPreviousMessages().then(() => (this.ready = true));
    }

    private async setPreviousMessages() {
        return idbQuery.getMessages(this.chatId).then((chatList) => (this.previousMessages = chatList.map((e) => e)));
    }

    public setRoleAssistant(message: DBMessage) {
        this.assistantMessage = message;
    }

    async sendChatMessage(userMessage: OllChatMessage) {
        // send prompt to ai
        OllamaApi.chat(
            userMessage,
            this.previousMessages,
            async (data) =>
                this.onResponseMessageStream({
                    assistantMessage: this.assistantMessage,
                    data,
                }),
            {
                ...this.body,
                stream: true,
            }
        );
    }

    async onResponseMessageStream({ assistantMessage, data }: SenderCallback<CallbackDataType>) {
        if (data.done) {
            this.onEnd({ data, assistantMessage });
        } else {
            this.onStream({ data, assistantMessage });
        }
    }
}
