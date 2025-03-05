import type { MessageImageType, PromptType } from '$types/db';

export type ChatParameters = {
	disabledPrompt: boolean;
	isPrompting: boolean;
	voiceListening: boolean;
	images?: MessageImageType;
	models: string[];
	promptSystem: PromptType;
	prompt: string;
	temperature: number;
	format?: 'json' | 'plain';
	template: string;
};


export const chatParametersState = createChatParams().chatParams;


export function createChatParams() {
	let _chatParams = $state<ChatParameters>({
		disabledPrompt: false,
		isPrompting   : false,
		images        : undefined,
		promptSystem  : {} as PromptType,
		voiceListening: false,
		temperature   : 0.5,
		format        : undefined,
		models        : [],
		prompt        : '',
		template      : ''
	});
	
	return {
		get chatParams() {
			return _chatParams;
		},
		set chatParams(parameters: ChatParameters) {
			_chatParams = { ...parameters, ..._chatParams };
		}
	};
}
