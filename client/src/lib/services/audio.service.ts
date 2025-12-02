import { userState } from '$lib/state/user.svelte';

export class AudioService {
    mediaRecorder: MediaRecorder | null = null;
    audioChunks: Blob[] = [];
    isRecording = false;
    stream: MediaStream | null = null;

    async startRecording(): Promise<void> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
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
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
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
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    playAudio(audioUrl: string) {
        const audio = new Audio(audioUrl);
        audio.play();
    }

    async transcribe(audioBlob: Blob): Promise<string> {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
        const response = await fetch(`${serverUrl}/api/audio/transcribe`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Transcription failed');
        }

        const data = await response.json();
        return data.text;
    }

    async speak(text: string, voiceId?: string, voiceTone: 'neutral' | 'fast' | 'slow' | 'deep' | 'high' = 'neutral'): Promise<void> {
        try {
            // Use the provided voiceId, or fallback to the user's locale preference
            const effectiveVoiceId = voiceId || userState.preferences.locale || 'en';

            const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
            const response = await fetch(`${serverUrl}/api/audio/speak`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, voiceId: effectiveVoiceId, voiceTone })
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
            window.speechSynthesis.cancel();

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
                const selectedVoice = voices.find(v => v.name.toLowerCase().includes(voiceId.toLowerCase()));
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.error('Browser does not support speech synthesis');
        }
    }
}

export const audioService = new AudioService();

