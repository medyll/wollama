// Type definitions for Ollama API

export enum OllamaFormatKeys {
    JSON = 'json',
    PLAIN = 'plain',
}

export type OllamaFormat = keyof typeof OllamaFormatKeys | '' | string;

// OllChatMessage
enum OllChatMessageRole {
    USER = 'user',
    SYSTEM = 'system',
    ASSISTANT = 'assistant',
}

export type OllApiGenerate = {
    model: string;
    prompt: string;
    images: string[];
    format: OllamaFormat;
    options: OllOptionsType;
    system: string | null;
    template: string | null;
    context: number[];
    stream?: boolean;
    raw?: boolean;
};

export type OllApiChat = {
    model: string;
    messages: OllChatMessage[];
    format?: OllamaFormat;
    options: OllOptionsType;
    template: string | null;
    stream?: boolean;
};

export type OllChatMessage = {
    role: keyof typeof OllChatMessageRole;
    prompt: string;
    images?: string[];
};

export type OllResponseType = {
    messageId: string;
    model: string;
    create_at: string;
    response: string;
    done: boolean;
    context: number[];
    createdAt: string;
    eval_count: number;
    eval_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    total_duration: number;
    message: {
        role: string;
        content: string;
        images: string | null;
    };
};

export type OllOptionsType = {
    seed?: number;
    temperature?: number;
    repeat_penalty?: number;
    top_k?: number;
    top_p?: number;
    num_ctx?: number;
    mirostat?: number;
    mirostat_eta?: number;
    mirostat_tau?: number;
    num_gqa?: number;
    num_gpu?: number;
    num_thread?: number;
    repeat_last_n?: number;
    stop?: string;
    tfs_z?: number;
    num_predict?: number;
};
