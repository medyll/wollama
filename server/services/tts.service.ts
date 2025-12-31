import { config } from '../config.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Service for Text-to-Speech
export const TtsService = {
	async speak(
		text: string,
		voiceId: string = 'alloy',
		voiceTone: 'neutral' | 'fast' | 'slow' | 'deep' | 'high' = 'neutral'
	): Promise<ArrayBuffer | null> {
		if (!config.tts.enabled) {
			console.log('TTS is disabled.');
			return null;
		}

		// 1. Local Provider (Piper)
		if (config.tts.provider === 'local') {
			return await this.speakLocal(text, voiceId, voiceTone);
		}

		// 2. OpenAI Compatible API
		try {
			const response = await fetch(config.tts.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					model: 'tts-1',
					input: text,
					voice: voiceId,
					speed: voiceTone === 'fast' ? 1.25 : voiceTone === 'slow' ? 0.75 : 1.0 // OpenAI API uses speed
				})
			});

			if (!response.ok) {
				throw new Error(`TTS API error: ${response.statusText}`);
			}

			return await response.arrayBuffer();
		} catch (error) {
			if (error instanceof TypeError && (error as any).cause?.code === 'ECONNREFUSED') {
				console.warn(`TTS Server not reachable at ${config.tts.url}. Ensure the TTS service is running.`);
			} else {
				console.error('TTS Error:', error);
			}
			return null;
		}
	},

	async speakLocal(
		text: string,
		voiceId?: string,
		voiceTone: 'neutral' | 'fast' | 'slow' | 'deep' | 'high' = 'neutral'
	): Promise<ArrayBuffer | null> {
		const binaryPath = config.tts.binaryPath;
		const modelDir = config.tts.modelDir;

		// Map voiceId (or language code) to model filename
		// Simple mapping strategy: check if voiceId matches a known model, or try to find a model for the language
		let modelName = config.tts.defaultVoice;

		if (voiceId) {
			// If voiceId is a full model name (e.g. "fr_FR-siwis-medium")
			if (fs.existsSync(path.join(modelDir, `${voiceId}.onnx`))) {
				modelName = `${voiceId}.onnx`;
			}
			// If voiceId is a language code (e.g. "fr", "fr-FR")
			else {
				const lang = voiceId.split('-')[0].toLowerCase();
				if (lang === 'fr') modelName = 'fr_FR-siwis-medium.onnx';
				else if (lang === 'en') modelName = 'en_US-lessac-medium.onnx';
				else if (lang === 'de') modelName = 'de_DE-thorsten-medium.onnx';
				else if (lang === 'es') modelName = 'es_ES-sharvard-medium.onnx';
				else if (lang === 'it') modelName = 'it_IT-riccardo-x_low.onnx';
			}
		}

		const modelPath = path.join(modelDir, modelName);

		if (!fs.existsSync(binaryPath)) {
			console.warn(`Piper binary not found at ${binaryPath}`);
			return null;
		}
		if (!fs.existsSync(modelPath)) {
			console.warn(`Piper model not found at ${modelPath}`);
			// Fallback to default if specific language model is missing
			if (modelName !== config.tts.defaultVoice) {
				console.warn(`Falling back to default voice: ${config.tts.defaultVoice}`);
				const defaultPath = path.join(modelDir, config.tts.defaultVoice);
				if (fs.existsSync(defaultPath)) {
					return this.speakLocalWithModel(text, binaryPath, defaultPath, voiceTone);
				}
			}
			return null;
		}

		return this.speakLocalWithModel(text, binaryPath, modelPath, voiceTone);
	},

	async speakLocalWithModel(
		text: string,
		binaryPath: string,
		modelPath: string,
		voiceTone: 'neutral' | 'fast' | 'slow' | 'deep' | 'high' = 'neutral'
	): Promise<ArrayBuffer | null> {
		const tempFile = path.join(os.tmpdir(), `piper-${Date.now()}-${Math.random().toString(36).substring(7)}.wav`);

		// Map tone to length_scale (speed)
		// Piper: length_scale < 1 is faster, > 1 is slower
		let lengthScale = '1.0';
		if (voiceTone === 'fast') lengthScale = '0.75';
		if (voiceTone === 'slow') lengthScale = '1.25';
		// For deep/high, we can't easily change pitch with just flags in Piper without post-processing.
		// We'll leave them as neutral speed for now, or maybe slightly adjust speed as a proxy?
		// Let's keep it simple.

		return new Promise((resolve) => {
			// Use --output_file to get a proper WAV file with headers
			// IMPORTANT: Set cwd to the binary directory so it can find DLLs/dependencies
			const piper = spawn(binaryPath, ['--model', modelPath, '--output_file', tempFile, '--length_scale', lengthScale], {
				cwd: path.dirname(binaryPath)
			});

			piper.stdin.write(text);
			piper.stdin.end();

			piper.stderr.on('data', (data) => {
				console.error(`[Piper stderr]: ${data}`);
			});

			piper.on('close', async (code) => {
				if (code === 0) {
					try {
						const buffer = await fs.promises.readFile(tempFile);
						await fs.promises.unlink(tempFile); // Cleanup
						resolve(buffer.buffer as ArrayBuffer);
					} catch (e) {
						console.error('Error reading Piper output:', e);
						resolve(null);
					}
				} else {
					console.error(`Piper process exited with code ${code}`);
					resolve(null);
				}
			});

			piper.on('error', (err) => {
				console.error('Failed to start Piper:', err);
				resolve(null);
			});
		});
	},

	async checkHealth(): Promise<boolean> {
		if (!config.tts.enabled) return false;

		if (config.tts.provider === 'local') {
			const defaultModelPath = path.join(config.tts.modelDir, config.tts.defaultVoice);
			return fs.existsSync(config.tts.binaryPath) && fs.existsSync(defaultModelPath);
		}

		try {
			const response = await fetch(config.tts.url, { method: 'GET' });
			return true;
		} catch (error) {
			if (error instanceof TypeError && (error as any).cause?.code === 'ECONNREFUSED') {
				return false;
			}
			return true;
		}
	}
};
