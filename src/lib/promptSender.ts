import type { ReaderData } from './tools/ollamaFetch';

const models = ['llama2-uncensored'];

let lastContext: number[] = [];

export const sendPrompt = async (prompt: any, hook: (content: any, end?: boolean) => void) => {
	await Promise.all(
		models.map(async (model) => {
			await askOllama(model, prompt, hook);
		})
	);
};

export const readerConst = {
	stop: false
};

const askOllama = async (model: any, prompt: any, hook: (content: string | undefined, end?: boolean) => void) => {
	readerConst.stop = false;

 

	const query = await sendQuery(prompt, lastContext, model);

	const streamReader = query.body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(splitStream('\n'))
		.getReader();

	while (true) {
		const { value, done } = await streamReader.read();
		if (done ?? readerConst.stop) {
			if (hook) hook(undefined,true);
			break;
		}

		try {
			const lines = value.split('\n');
			for (const line of lines) {
				if (line !== '') {
					const data: ReaderData = JSON.parse(line);
					if (data.response !== '\n') {
						if (hook) hook(data.response);
					}
				}
			}
		} catch (error) {
			break;
		}
	}
};

async function sendQuery(userPrompt: string, context: any, model: string) {
	const settings = {} as any;

	/* const ollama = new Ollama();
	await ollama.setModel(model);
	await ollama.setContext(context);
	await ollama.streamingGenerate(
		userPrompt,
		(content: any) => {
			console.log(content);
		},
		(context: any) => {
			console.log(context);
		},
		(fullResponse: any) => {
			console.log(fullResponse);
		},
		(stats: any) => {
			console.log(stats);
		}
	); */

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
