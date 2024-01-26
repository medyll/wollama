import { OllamaApi } from '$lib/db/ollamaApi';
import type { DBMessage } from '$types/db';
import type { OllChatMessage, OllApiChat, OllOptionsType, OllResponseType, OllamaFormat } from '$types/ollama';

export type PromptSenderType = {
    prompt: string;
    context: number[];
    models: string[];
    images?: string[];
    options: OllOptionsType;
    format: OllamaFormat;
};

export type SenderCallback<T> = {
    data: OllResponseType;
} & T;

type CallbackDataType = {
    assistantMessage: DBMessage;
};

/**
 * Represents a class that sends prompts and receives responses in a chat.
 * uses api/generate or api/chat depending of chatSessionType
 */
export class PromptMaker {
    private assistantMessage!: DBMessage;
    public chatSessionType: 'generate' | 'chat' = 'chat';
    //
    private apiChatParams!: Partial<OllApiChat>;

    /**
     * Creates an instance of PromptSender.
     * @param chatId - The ID of the chat.
     * @param apiChatParams - The chat apiChatParams | body.
     */
    constructor(apiChatParams = {} as PromptMaker['apiChatParams']) {
        this.apiChatParams = apiChatParams as OllApiChat;
    }

    /**
     * Event handler for receiving a response stream.
     * @param args - The callback data containing the response and assistant message.
     */
    onStream!: (args: SenderCallback<CallbackDataType>) => void;

    /**
     * Event handler for the end of the response stream.
     * @param args - The callback data containing the response and assistant message.
     */
    onEnd!: (args: SenderCallback<CallbackDataType>) => void;

    /**
     * Sets the assistant message for the chat.
     * @param message - The assistant message.
     */
    public setRoleAssistant(message: DBMessage): void {
        this.assistantMessage = message;
    }

    /**
     * Sends a chat message and play a callback
     * @param userMessage - The user message to send.
     */
    async sendChatMessage(userMessage: OllChatMessage, previousMessages, systemPrompt?: string): Promise<void> {
        // send chat user message
        return OllamaApi.chat(userMessage, previousMessages, systemPrompt, this.apiChatParams, async (data) => {
            this.onResponseMessageStream({
                assistantMessage: this.assistantMessage,
                data,
            });
        });
    }

    /**
     * Handles the response message stream.
     * @param args - The callback data containing the response and assistant message.
     */
    private async onResponseMessageStream({ assistantMessage, data }: SenderCallback<CallbackDataType>): Promise<void> {
        if (data.done) {
            this.onEnd({ data, assistantMessage });
        } else {
            this.onStream({ data, assistantMessage });
        }
    }
}
