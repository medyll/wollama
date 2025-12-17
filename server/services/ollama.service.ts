 
import { Ollama } from 'ollama';
import { config } from '../config.js';

const ollama = new Ollama({ host: config.ollama.host });

export const OllamaService = {
	// Expose the raw instance
	instance: ollama,

	// Chat & Generate
	async chat(payload: any) {
		return await ollama.chat(payload);
	},

	async generate(payload: any) {
		return await ollama.generate(payload);
	},

	// Model Management
	async list() {
		return await ollama.list();
	},

	// Alias for compatibility
	async listModels() {
		return await ollama.list();
	},

	async show(payload: any) {
		return await ollama.show(payload);
	},

	async create(payload: any) {
		return await ollama.create(payload);
	},

	async copy(payload: any) {
		return await ollama.copy(payload);
	},

	async delete(payload: any) {
		return await ollama.delete(payload);
	},

	async pull(payload: any) {
		return await ollama.pull(payload);
	},

	async push(payload: any) {
		return await ollama.push(payload);
	},

	// Embeddings
	async embed(payload: any) {
		return await ollama.embed(payload);
	},

	async embeddings(payload: any) {
		return await ollama.embeddings(payload);
	},

	// System
	async ps() {
		return await ollama.ps();
	},

	abort() {
		return ollama.abort();
	}
};
