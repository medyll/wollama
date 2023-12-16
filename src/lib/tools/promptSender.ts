import type { ChatDataType } from '$lib/stores/chatter'; 
import { aiResponseState } from '$lib/stores/chatEditListener';
import { OllamaFetch, type OllamaStreamLine } from './ollamaFetch'; 

export type PromptSenderType = {
	prompt: string;
	context: number[];
	models: string[];
};

export type SenderCallback<T> = { 
	data: OllamaStreamLine;
} & T;

type ArgsType<T> = {
	cb: (args: SenderCallback<T>) => void;
	cbData:   T   ;
};

export class PromptSender<T>  {
	chatId!: string;
	chat!: ChatDataType;
	cb!: (args: SenderCallback<T>) => void;
	
	private cbData!: any;

	constructor(chat: ChatDataType, args: ArgsType<T>) {
		this.chat = chat;
		this.chatId = chat.chatId;

		this.cb = args.cb;
		this.cbData = args.cbData;
	}

	async sendMessage(content: string) {
		const chat = this.chat;

		aiResponseState.set('running');

		let sender = { prompt: content, context: chat?.context ?? [], models: chat.models };
		// use args as a parameter
		this.sendPrompt(
			sender,
			async (data) => this.cb({ ...this.cbData, data })
		);
	}

	async sendPrompt(sender: PromptSenderType, hook: (data: OllamaStreamLine) => void) {
		await Promise.all(
			sender.models.map(async (model) => {
				await OllamaFetch.generate(sender.prompt, hook, { stream: true, model, context: sender.context });
			})
		);
	}
}
