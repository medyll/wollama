import type { OllamaStream, OllamaStreamLine } from './tools/ollamaFetch';

const models = ['llama2-uncensored'];

let lastContext: number[] = [];

export const sendPrompt = async (prompt: any, hook: (data: OllamaStreamLine) => void) => {
	await Promise.all(
		models.map(async (model) => {
			await askOllama(model, prompt, hook);
		})
	);
};

export const readerConst = {
	stop: false
};

const askOllama = async (model: any, prompt: any, hook: (data: OllamaStreamLine) => void) => {
	readerConst.stop = false;

	const query = await sendQuery(prompt, lastContext, model);

	const streamReader = query.body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(splitStream('\n'))
		.getReader();

	while (true) {
		const { value, done } = await streamReader.read(); 

		if (done ?? readerConst.stop) {
			break;
		}
		if (value) {
			const data: OllamaStreamLine = JSON.parse(value);

			if (data.response !== '\n') {
				if (hook) hook(data);
			}
		}
	}
};

async function sendQuery(userPrompt: string, context: any, model: string) {
	const settings = {} as any;

	return await fetch(`http://127.0.0.1:11434/api/generate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'text/event-stream'
		},
		body: JSON.stringify({
			model: model,
			prompt: userPrompt,
			system: settings?.system,
			format: settings?.requestFormat,
			options: settings?.llamaOptions,
			stream: true,
			context
		})
	});
}

function splitStream(separator: string) {
	let buffer = '';
	return new TransformStream({
		transform(chunk, controller) {
			buffer += chunk;
			const parts = buffer.split(separator);
			parts.slice(0, -1).forEach((part) => controller.enqueue(part));
			buffer = parts[parts.length - 1];
		},
		flush(controller) {
			if (buffer) controller.enqueue(buffer);
		}
	});
}
