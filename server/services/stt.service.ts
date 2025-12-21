import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

// Service for Speech-to-Text (Whisper)
export const SttService = {
	async transcribe(audioBuffer: Buffer, filename: string = 'audio.wav'): Promise<string> {
		if (!config.stt.enabled) {
			console.log('STT is disabled. Returning mock transcription.');
			return 'Transcription simulée (STT désactivé)';
		}

		if (config.stt.provider === 'local') {
			return this.transcribeLocal(audioBuffer);
		}

		try {
			const formData = new FormData();
			const blob = new Blob([audioBuffer], { type: 'audio/wav' });
			formData.append('file', blob, filename);
			formData.append('model', 'whisper-1'); // Default model name for OpenAI API

			const response = await fetch(config.stt.url, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`STT API error: ${response.statusText}`);
			}

			const data = (await response.json()) as { text: string };
			return data.text;
		} catch (error) {
			console.error('STT Error:', error);
			throw error;
		}
	},

	async transcribeLocal(audioBuffer: Buffer): Promise<string> {
		const binaryPath = config.stt.binaryPath;
		const modelPath = config.stt.modelPath;

		if (!fs.existsSync(binaryPath)) {
			console.warn(`Whisper binary not found at ${binaryPath}`);
			return 'Erreur: Binaire Whisper introuvable';
		}
		if (!fs.existsSync(modelPath)) {
			console.warn(`Whisper model not found at ${modelPath}`);
			return 'Erreur: Modèle Whisper introuvable';
		}

		// Create a temp file for the audio input
		const tempInputFile = path.join(os.tmpdir(), `whisper-in-${Date.now()}-${Math.random().toString(36).substring(7)}.wav`);

		try {
			await fs.promises.writeFile(tempInputFile, audioBuffer);

			return new Promise((resolve, reject) => {
				// Assuming whisper.cpp main binary usage:
				// ./main -m models/ggml-base.en.bin -f input.wav --output-txt --no-timestamps
				// We'll capture stdout directly if possible, or read the output file.
				// Many whisper CLIs output to stdout by default or with specific flags.
				// Let's assume standard whisper.cpp behavior: it prints to stdout but includes metadata.
				// We might need to parse it or use a specific flag for clean output.
				// For simplicity, let's try to capture stdout and clean it up.

				const whisper = spawn(binaryPath, [
					'-m',
					modelPath,
					'-f',
					tempInputFile,
					'-nt', // No timestamps
					'--no-prints' // Don't print progress
				]);

				let output = '';
				let errorOutput = '';

				whisper.stdout.on('data', (data) => {
					output += data.toString();
				});

				whisper.stderr.on('data', (data) => {
					errorOutput += data.toString();
				});

				whisper.on('close', async (code) => {
					// Cleanup input file
					try {
						await fs.promises.unlink(tempInputFile);
					} catch {
						// Ignore cleanup errors
					}

					if (code === 0) {
						// Clean up the output (trim whitespace)
						resolve(output.trim());
					} else {
						console.error(`Whisper process exited with code ${code}`);
						console.error(`Stderr: ${errorOutput}`);
						resolve('Erreur lors de la transcription locale');
					}
				});

				whisper.on('error', (err) => {
					console.error('Failed to start Whisper:', err);
					resolve('Erreur: Impossible de lancer Whisper');
				});
			});
		} catch (e) {
			console.error('Error in local transcription:', e);
			try {
				await fs.promises.unlink(tempInputFile);
			} catch {
				// Ignore cleanup errors
			}
			return 'Erreur interne de transcription';
		}
	}
};
