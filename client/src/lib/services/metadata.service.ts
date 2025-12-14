import { userState } from '$lib/state/user.svelte';
import { getDatabase } from '$lib/db';
import type { Chat } from '$types/data';

interface MetadataResponse {
	title?: string;
	description?: string;
	category?: string;
	tags?: string[];
}

export class MetadataService {
	private static async generate(prompt: string, system: string): Promise<MetadataResponse | null> {
		const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
		const model = userState.preferences.defaultModel;

		try {
			const response = await fetch(`${serverUrl}/api/chat/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model,
					messages: [
						{ role: 'system', content: system },
						{ role: 'user', content: prompt }
					],
					stream: false,
					format: 'json'
				})
			});

			if (!response.ok) throw new Error('Failed to generate metadata');

			const data = await response.json();
			// Ollama returns { model: ..., created_at: ..., message: { role: ..., content: ... }, done: ... }
			const content = data.message?.content;

			if (!content) return null;

			try {
				return JSON.parse(content);
			} catch (e) {
				console.error('Failed to parse metadata JSON:', content);
				return null;
			}
		} catch (e) {
			console.error('Metadata generation error:', e);
			return null;
		}
	}

	static async generateChatMetadata(chatContent: string): Promise<MetadataResponse | null> {
		const categoryPresets = [
			'Coding',
			'Design',
			'Development',
			'Marketing',
			'Sales',
			'Support',
			'Management',
			'HR',
			'Finance',
			'Medicine',
			'Legal',
			'Livres',
			'Ecriture',
			'Espace'
		].join(', ');

		const prompt = `
        Basé sur la conversation suivante:
        - Génère un titre très court et accrocheur (max 10 mots).
        - Catégorise-la en un seul mot. Choisis parmi: [${categoryPresets}] ou propose une nouvelle pertinente.
        - Résume la conversation en 2-3 phrases concises (description).
        - Crée jusqu'à 4 tags pertinents (mots-clés).

        Conversation:
        ${chatContent}
        
        Retourne UNIQUEMENT un objet JSON avec les clés: "title", "description", "category", "tags" (tableau de chaînes).
        `;

		const system = `Tu es un assistant expert en classification et résumé. Tu réponds uniquement en JSON valide.`;

		return this.generate(prompt, system);
	}

	static async updateChatMetadata(chatId: string) {
		const db = await getDatabase();

		const messages = await db.messages
			.find({
				selector: { chat_id: chatId },
				sort: [{ created_at: 'asc' }],
				limit: 10 // Analyze first 10 messages to get the gist
			})
			.exec();

		if (messages.length < 2) return; // Need at least some context

		const content = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');
		const metadata = await this.generateChatMetadata(content);

		if (metadata) {
			const chat = await db.chats.findOne(chatId).exec();
			if (chat) {
				const updateData: Partial<Chat> = {};

				if (metadata.title) updateData.title = metadata.title;
				if (metadata.description) updateData.description = metadata.description;
				if (metadata.category) updateData.category = metadata.category;
				if (metadata.tags && Array.isArray(metadata.tags)) {
					updateData.tags = metadata.tags;
				}

				await chat.patch(updateData);

				// Save tags to Tags table
				if (metadata.tags && Array.isArray(metadata.tags)) {
					for (const tagName of metadata.tags) {
						// Check if tag exists
						const existing = await db.tags.findOne({ selector: { name: tagName } }).exec();
						if (!existing) {
							await db.tags.insert({
								tag_id: crypto.randomUUID(),
								name: tagName,
								created_at: Date.now()
							});
						}
					}
				}
			}
		}
	}
}
