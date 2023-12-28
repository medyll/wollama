import { notifierState } from '$lib/stores/notifications';
import type { OllamaApiBody, OllamaOptionsType, OllamaResponseType } from '$types/ollama';
import { ApiCall } from '../db/apiCall';

export type PromptSenderType = {
	prompt: string;
	context: number[];
	models: string[];
	images?: string[];
	options: OllamaOptionsType;
	format: 'json' | 'plain' | '' | string;
};

export type SenderCallback<T> = {
	data: OllamaResponseType;
} & T;

type ArgsType<T> = {
	cb: (args: SenderCallback<T>) => void /** callback */;
	cbData: T /** data to merge with the callback data */;
};

export class PromptSender<T> { 
	args: ArgsType<T>; 
	ollamaBody: OllamaApiBody;

	constructor( ollamaBody: Partial<OllamaApiBody>, args: ArgsType<T>) { 
		this.ollamaBody = ollamaBody as OllamaApiBody;
		this.args = args;
	}

	async sendMessage() {
		return new Promise(async (resolve, reject) => {
			try {
				await ApiCall.generate(
					this.ollamaBody.prompt,
					async (data) => this.args.cb({ ...this.args.cbData, data }),
					{
						...this.ollamaBody,
						stream: true
					}
				);
				resolve(true)
			} catch (e) {
				if (e.error) {
					notifierState.notify('error', e.error);
				}
				reject(e);
			}
		});
	}
}
