import type { OllamaOptionsType } from '$types/ollama';

export interface SettingsType {
	theme: string;
	request_mode?: 'plain' | 'json';
	ollama_server: string;
	ollamaModels?: string[]; // by api
	defaultModels?: string[];
	defaultModel?: string;
	chatModelKeys?: string[];
	authHeader: boolean;
	system_prompt?: string;
	locale: string;
	title_auto: boolean;
	voice_auto_stop: boolean;
	avatar_email: string;
	temperatures: {
		creative: number;
		balanced: number;
		accurate: number;
	};
	sender: {
		speechAutoSend?: boolean;
		speechRecognition?: boolean;
		system?: string;
	};
}
