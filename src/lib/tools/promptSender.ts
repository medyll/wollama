import type { ChatType } from '$types/db';
import type { OllamaOptionsType, OllamaResponseType } from '$types/ollama';
import { OllamaFetch } from './ollamaFetch';

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
	cb: (args: SenderCallback<T>) => void; /** callback */
	cbData: T; /** data to merge with the callback data */
	images?: string[];
};

export class PromptSender<T> {
	chat!: ChatType;
	args: ArgsType<T>;

	constructor(chat: ChatType, args: ArgsType<T>) {
		this.chat = chat;
		this.args = args;
	}

	async sendMessage(prompt: string) {
		const chat = this.chat;

		let sender: PromptSenderType = {
			prompt: prompt,
			context: chat?.context ?? [],
			models: chat.models,
			images: this.args.images ?? [],
			options: chat.options
		};
		// use args as a parameter
		this.sendPrompt(sender, async (data) => this.args.cb({ ...this.args.cbData, data }));
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
