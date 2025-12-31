import { userState } from '$lib/state/user.svelte';
import { uiState } from '$lib/state/ui.svelte';

export class AudioService {
	mediaRecorder: MediaRecorder | null = null;
	audioChunks: Blob[] = [];
	isRecording = false;
	stream: MediaStream | null = null;
	currentAudio: HTMLAudioElement | null = null;

	async startRecording(): Promise<void> {
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('Media Devices API not supported');
			}

			const constraints: MediaStreamConstraints = {
				audio: userState.preferences.audioInputId ? { deviceId: { exact: userState.preferences.audioInputId } } : true
			};

			this.stream = await navigator.mediaDevices.getUserMedia(constraints);

			const mimeType = MediaRecorder.isTypeSupported('audio/webm')
				? 'audio/webm'
				: MediaRecorder.isTypeSupported('audio/mp4')
					? 'audio/mp4'
					: '';

			this.mediaRecorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);
			this.audioChunks = [];

			this.mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					this.audioChunks.push(event.data);
				}
			};

			this.mediaRecorder.start();
			this.isRecording = true;
		} catch (error) {
			console.error('Error accessing microphone:', error);
			throw error;
		}
	}

	stopRecording(): Promise<Blob> {
		return new Promise((resolve, reject) => {
			if (!this.mediaRecorder) {
				reject(new Error('No recording in progress'));
				return;
			}

			this.mediaRecorder.onstop = () => {
				const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
				const audioBlob = new Blob(this.audioChunks, { type: mimeType });
				this.audioChunks = [];
				this.isRecording = false;
				this.stopStream();
				resolve(audioBlob);
			};

			this.mediaRecorder.stop();
		});
	}

	stopStream() {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}
	}

	stopAudio() {
		if (this.currentAudio) {
			this.currentAudio.pause();
			this.currentAudio = null;
		}
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
		}
		uiState.setAudioPlaying(false);
	}

	playAudio(audioUrl: string) {
		this.stopAudio();
		const audio = new Audio(audioUrl);
		this.currentAudio = audio;
		const outputId = userState.preferences.audioOutputId;
		if (outputId && (audio as any).setSinkId) {
			(audio as any).setSinkId(outputId).catch((e: any) => console.warn('Failed to set audio output', e));
		}
		audio.onended = () => {
			this.currentAudio = null;
			uiState.setAudioPlaying(false);
		};
		audio.play();
		uiState.setAudioPlaying(true);
	}

	async getDevices() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			return { inputs: [], outputs: [] };
		}

		const devices = await navigator.mediaDevices.enumerateDevices();
		return {
			inputs: devices.filter((d) => d.kind === 'audioinput'),
			outputs: devices.filter((d) => d.kind === 'audiooutput')
		};
	}

	async monitorMicrophone(deviceId: string, onLevelChange: (level: number) => void): Promise<() => void> {
		try {
			const constraints = {
				audio: deviceId ? { deviceId: { exact: deviceId } } : true
			};
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			const audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);

			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			let isActive = true;

			const update = () => {
				if (!isActive) return;
				analyser.getByteFrequencyData(dataArray);
				// Calculate average volume
				let sum = 0;
				for (let i = 0; i < dataArray.length; i++) {
					sum += dataArray[i];
				}
				const average = sum / dataArray.length;
				// Normalize to 0-100 roughly
				const level = Math.min(100, Math.round((average / 255) * 100 * 2));
				onLevelChange(level);
				requestAnimationFrame(update);
			};
			update();

			return () => {
				isActive = false;
				stream.getTracks().forEach((track) => track.stop());
				audioContext.close();
			};
		} catch (error) {
			console.error('Error monitoring microphone:', error);
			return () => {};
		}
	}

	playTestSound() {
		// Simple beep using oscillator
		const audioContext = new AudioContext();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4

		gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		const outputId = userState.preferences.audioOutputId;
		if (outputId && (audioContext as any).setSinkId) {
			(audioContext as any).setSinkId(outputId).catch((e: any) => console.warn('setSinkId failed', e));
		}

		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.5);
	}

	async transcribe(audioBlob: Blob): Promise<string> {
		const formData = new FormData();
		const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
		formData.append('file', audioBlob, `recording.${ext}`);

		const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
		try {
			const response = await fetch(`${serverUrl}/api/audio/transcribe`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`Transcription failed: ${response.statusText}`);
			}

			const data = await response.json();
			return data.text;
		} catch (error) {
			console.error('Transcription error:', error);
			throw error;
		}
	}

	async speak(
		text: string,
		voiceId?: string,
		voiceTone: 'neutral' | 'fast' | 'slow' | 'deep' | 'high' = 'neutral'
	): Promise<void> {
		try {
			// Use the provided voiceId, or fallback to the user's locale preference
			const effectiveVoiceId = voiceId || userState.preferences.locale || 'en';

			const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
			const response = await fetch(`${serverUrl}/api/audio/speak`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text,
					voiceId: effectiveVoiceId,
					voiceTone,
					locale: userState.preferences.locale // Explicitly pass locale
				})
			});

			if (!response.ok) {
				throw new Error('TTS failed');
			}

			const audioBlob = await response.blob();
			const audioUrl = URL.createObjectURL(audioBlob);
			this.playAudio(audioUrl);
		} catch (e) {
			console.warn('Server TTS failed, falling back to browser TTS', e);
			this.speakBrowser(text, voiceId, voiceTone);
		}
	}

	speakBrowser(text: string, voiceId?: string, voiceTone: 'neutral' | 'fast' | 'slow' | 'deep' | 'high' = 'neutral') {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			// Cancel any ongoing speech
			this.stopAudio();

			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = userState.preferences.locale || 'en';

			// Apply tone (speed)
			if (voiceTone === 'fast') utterance.rate = 1.2;
			if (voiceTone === 'slow') utterance.rate = 0.8;
			// Browser TTS pitch
			if (voiceTone === 'deep') utterance.pitch = 0.8;
			if (voiceTone === 'high') utterance.pitch = 1.2;

			// Try to find a matching voice if voiceId is provided
			if (voiceId) {
				const voices = window.speechSynthesis.getVoices();
				// Simple matching strategy: check if voice name contains the ID (case insensitive)
				const selectedVoice = voices.find((v) => v.name.toLowerCase().includes(voiceId.toLowerCase()));
				if (selectedVoice) {
					utterance.voice = selectedVoice;
				}
			}

			utterance.onend = () => {
				uiState.setAudioPlaying(false);
			};

			utterance.onerror = () => {
				uiState.setAudioPlaying(false);
			};

			window.speechSynthesis.speak(utterance);
			uiState.setAudioPlaying(true);
		} else {
			console.error('Browser does not support speech synthesis');
		}
	}

	listen(onResult: (text: string) => void, onError: (err: any) => void): () => void {
		if (typeof window === 'undefined') return () => {};

		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) {
			onError(new Error('Speech Recognition not supported'));
			return () => {};
		}

		const recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = userState.preferences.locale || 'en-US';

		recognition.onresult = (event: any) => {
			let finalTranscript = '';
			for (let i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					finalTranscript += event.results[i][0].transcript;
				}
			}
			if (finalTranscript) {
				onResult(finalTranscript);
			}
		};

		recognition.onerror = (event: any) => {
			console.error('Speech recognition error', event.error);
			onError(event.error);
		};

		try {
			recognition.start();
		} catch (e) {
			console.error('Failed to start speech recognition', e);
			onError(e);
		}

		return () => recognition.stop();
	}
}

export const audioService = new AudioService();
