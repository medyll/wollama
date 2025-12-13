import { userState } from './user.svelte';
import { toast } from './notifications.svelte';

class DownloadState {
	isPulling = $state(false);
	progress = $state(0);
	status = $state('');
	currentModel = $state('');

	async pullModel(modelName: string) {
		if (!modelName.trim()) return;
		if (this.isPulling) {
			toast.error('A download is already in progress');
			return;
		}

		this.isPulling = true;
		this.progress = 0;
		this.status = 'Starting...';
		this.currentModel = modelName;

		try {
			const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
			const response = await fetch(`${serverUrl}/api/models/pull`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ model: modelName })
			});

			if (!response.ok) throw new Error('Pull failed');
			if (!response.body) throw new Error('No response body');

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n').filter((line) => line.trim() !== '');

				for (const line of lines) {
					try {
						const json = JSON.parse(line);
						if (json.status) this.status = json.status;
						if (json.completed && json.total) {
							this.progress = Math.round((json.completed / json.total) * 100);
						}
					} catch (e) {
						// ignore
					}
				}
			}

			toast.success(`Model ${modelName} installed!`);
		} catch (e) {
			console.error(e);
			toast.error('Failed to pull model');
		} finally {
			this.isPulling = false;
			this.currentModel = '';
		}
	}
}

export const downloadState = new DownloadState();
