import { userState } from '$lib/state/user.svelte';

export class EmotionalTtsService {
	static async synthesize(text: string, emotionTags: string[] = [], parameters: any = {}): Promise<ArrayBuffer> {
		// Use the Server API which proxies to the Python Sidecar
		// This works for Web, Mobile, and Desktop (if connected to the server)

		const serverUrl = userState.preferences.serverUrl || 'http://localhost:3000';

		try {
			const response = await fetch(`${serverUrl}/api/audio/speak`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text,
					voiceId: 'chatterbox', // Special ID to trigger emotional TTS if tags are present
					voiceTone: 'neutral',
					emotionTags,
					parameters
				})
			});

			if (!response.ok) {
				throw new Error(`Emotional TTS failed: ${response.statusText}`);
			}

			return await response.arrayBuffer();
		} catch (error) {
			console.error('Emotional TTS Error:', error);
			throw error;
		}
	}
}
