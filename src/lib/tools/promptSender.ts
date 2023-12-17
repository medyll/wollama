import type { ChatType } from '$types/db';
import type { OllamaOptionsType, OllamaResponseType } from '$types/ollama';
import { OllamaFetch, } from './ollamaFetch'; 

export type PromptSenderType = {
	prompt: string;
	context: number[];
	models: string[];
	images?: string[];
	options: OllamaOptionsType;
};

export type SenderCallback<T> = {
	data: OllamaResponseType;
} & T;

type ArgsType<T> = {
	cb: (args: SenderCallback<T>) => void;
	cbData: T;
};

export class PromptSender<T> {
	chatId!: string;
	chat!: ChatType;
	cb!: (args: SenderCallback<T>) => void; 

	private cbData!: any;

	constructor(chat: ChatType, args: ArgsType<T>) {
		this.chat = chat;
		this.chatId = chat.chatId;

		this.cb = args.cb;
		this.cbData = args.cbData;
 
	}

	async sendMessage(prompt: string) {
		const chat = this.chat;


		let sender: PromptSenderType = {
			prompt: prompt,
			context: chat?.context ?? [],
			models: chat.models,
			images: chat.images,
			options: chat.options
		};
		// use args as a parameter
		this.sendPrompt(sender, async (data) => this.cb({ ...this.cbData, data }));
	}

	async sendPrompt(sender: PromptSenderType, hook: (data: OllamaResponseType) => void) {
		await Promise.all(
			sender.models.map(async (model) => {
				await OllamaFetch.generate(sender.prompt, hook, {
					stream: true,
					model,
					context: sender.context,
					options: sender.options,
					images: sender.images
				});
			})
		);
	}
}
