import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
	ffmpeg.setFfmpegPath(ffmpegPath);
}

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

		// Create temp files
		const tempInputFile = path.join(os.tmpdir(), `whisper-in-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`);
		const tempWavFile = path.join(os.tmpdir(), `whisper-conv-${Date.now()}-${Math.random().toString(36).substring(7)}.wav`);

		console.log(`[STT] Starting local transcription...`);
		console.log(`[STT] Binary: ${binaryPath}`);
		console.log(`[STT] Model: ${modelPath}`);
		console.log(`[STT] Input (Temp): ${tempInputFile}`);

		try {
			await fs.promises.writeFile(tempInputFile, audioBuffer);
			console.log(`[STT] Input file written. Size: ${audioBuffer.length} bytes`);

			// Convert to 16kHz WAV using ffmpeg
			console.log(`[STT] Converting to 16kHz WAV...`);
			await new Promise<void>((resolve, reject) => {
				ffmpeg(tempInputFile)
					.toFormat('wav')
					.audioFrequency(16000)
					.audioChannels(1)
					.on('end', () => {
						console.log('[STT] Conversion complete.');
						resolve();
					})
					.on('error', (err) => {
						console.error('[STT] FFmpeg error:', err);
						reject(err);
					})
					.save(tempWavFile);
			});

			// Check if WAV file exists and has size
			const wavStats = await fs.promises.stat(tempWavFile);
			console.log(`[STT] WAV file ready. Size: ${wavStats.size} bytes`);

			return new Promise((resolve, reject) => {
				const args = [
					'-m',
					modelPath,
					'-f',
					tempWavFile,
					'-nt', // No timestamps
					'-l',
					'auto' // Auto-detect language
				];
				console.log(`[STT] Spawning Whisper: ${binaryPath} ${args.join(' ')}`);

				const whisper = spawn(binaryPath, args, {
					cwd: path.dirname(binaryPath)
				});

				let output = '';
				let errorOutput = '';

				whisper.stdout.on('data', (data) => {
					output += data.toString();
				});

				whisper.stderr.on('data', (data) => {
					errorOutput += data.toString();
					console.log(`[Whisper Stderr]: ${data}`);
				});

				whisper.on('close', async (code) => {
					console.log(`[STT] Whisper exited with code ${code}`);

					// Cleanup temp files
					try {
						if (fs.existsSync(tempInputFile)) await fs.promises.unlink(tempInputFile);
						if (fs.existsSync(tempWavFile)) await fs.promises.unlink(tempWavFile);
					} catch (e) {
						console.warn('[STT] Cleanup warning:', e);
					}

					if (code === 0) {
						const text = output.trim();
						console.log(`[STT] Transcription result: "${text}"`);
						resolve(text);
					} else {
						console.error(`[STT] Failed. Code: ${code}`);
						console.error(`[STT] Stderr: ${errorOutput}`);
						// Return the error details for debugging
						resolve(`Erreur STT (Code ${code}): ${errorOutput.slice(0, 100)}...`);
					}
				});

				whisper.on('error', (err) => {
					console.error('[STT] Failed to start Whisper process:', err);
					resolve(`Erreur lancement Whisper: ${err.message}`);
				});
			});
		} catch (e: any) {
			console.error('[STT] Exception during transcription:', e);
			try {
				if (fs.existsSync(tempInputFile)) await fs.promises.unlink(tempInputFile);
				if (fs.existsSync(tempWavFile)) await fs.promises.unlink(tempWavFile);
			} catch {
				// Ignore cleanup errors
			}
			return `Erreur interne STT: ${e.message}`;
		}
	}
};
