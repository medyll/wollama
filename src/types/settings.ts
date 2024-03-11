export interface SettingsType {
    id?: number;
    userId?: number;
    theme?: string;
    request_mode?: 'plain' | 'json';
    ollama_server: string;
    ollamaModels?: string[]; // by api
    defaultModels?: string[];
    defaultModel: string;
    chatModelKeys?: string[];
    authHeader: boolean;
    system_prompt: string;
    locale: string;
    title_auto: boolean;
    voice_auto_stop: boolean;
    avatar_email: string;
    temperatures: {
        creative: number;
        balanced: number;
        accurate: number;
        [key: string]: number;
    };
    sender: {
        speechAutoSend?: boolean;
        speechRecognition?: boolean;
        system?: string;
    };
}
