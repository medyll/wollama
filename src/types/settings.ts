import type { OllamaOptionsType } from '$types/ollama';

export interface SettingsType {
	theme?: string;
	requestFormat?: string;
	ollama_server?: string;
	ollamaModels?: string[]; // by api
	defaultModels?: string[];
	defaultModel?: string;
	chatModelKeys?: string[];
	authHeader: boolean;
	system_prompt?: string;
	locale: string;
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
	llamaOptions?: OllamaOptionsType;
}
