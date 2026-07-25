import { OllamaService } from '../ollama.service.js';
import { config } from '../../config.js';

export async function embedText(text: string): Promise<number[]> {
	const result = await OllamaService.embed({
		model: config.rag.embedModel,
		input: text
	});
	// ollama's embed() returns { embeddings: number[][] }
	const embedding = result.embeddings?.[0];
	if (!embedding) {
		throw new Error('Ollama returned no embedding');
	}
	return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
	const result = await OllamaService.embed({
		model: config.rag.embedModel,
		input: texts
	});
	if (!result.embeddings || result.embeddings.length !== texts.length) {
		throw new Error('Ollama returned an unexpected number of embeddings');
	}
	return result.embeddings;
}
