import { getDatabase } from '$lib/db';
import { userState } from '$lib/state/user.svelte';
import { contextState } from '$lib/state/context.svelte';
import { toast } from '$lib/state/notifications.svelte';
import { t } from '$lib/state/i18n.svelte';
import { MetadataService } from './metadata.service';

export class ChatService {
	async createChat(title?: string, model: string = userState.preferences.defaultModel, companionId?: string): Promise<string> {
		console.log('Creating new chat...');
		try {
			const db = await getDatabase();
			console.log('Database retrieved');

			const chatId = crypto.randomUUID();
			const userId = userState.uid || 'anonymous';

			// Generate default title if not provided: "Discussion [Day] [HH:mm]"
			if (!title) {
				const now = new Date();
				const day = now.toLocaleDateString(undefined, { weekday: 'long' });
				const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
				// Capitalize first letter of day
				const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
				title = `Discussion ${dayCapitalized} ${time}`;
			}

			let systemPrompt = '';
			if (companionId) {
				// Check user_companions first (custom/overridden)
				let companion = await db.user_companions.findOne(companionId).exec();

				// If not found, check system companions
				if (!companion) {
					companion = await db.companions.findOne(companionId).exec();
				}

				if (companion) {
					systemPrompt = companion.system_prompt;
				}
			}

			const chatData: Record<string, unknown> = {
				chat_id: chatId,
				user_id: userId,
				title,
				model,
				created_at: Date.now(),
				updated_at: Date.now(),
				tags: [],
				context: [],
				companion_id: companionId || '', // Ensure companion_id is never undefined/null for indexing
				system_prompt: systemPrompt
			};

			console.log('Inserting chat data:', chatData);
			await db.chats.insert(chatData);
			console.log('Chat inserted:', chatId);

			return chatId;
		} catch (error) {
			console.error('Error in createChat:', error);
			throw error;
		}
	}

	async getChats() {
		const db = await getDatabase();
		const userId = userState.uid || 'anonymous';
		return db.chats.find({
			selector: {
				user_id: userId
			},
			sort: [{ updated_at: 'desc' }]
		}).$;
	}

	async getChat(chatId: string) {
		const db = await getDatabase();
		return db.chats.findOne(chatId).exec();
	}

	async getMessages(chatId: string) {
		const db = await getDatabase();
		return db.messages.find({
			selector: {
				chat_id: chatId
			},
			sort: [{ created_at: 'asc' }]
		}).$;
	}

	async getChatHistory(chatId: string) {
		const db = await getDatabase();
		return db.messages
			.find({
				selector: {
					chat_id: chatId
				},
				sort: [{ created_at: 'asc' }]
			})
			.exec();
	}

	async addMessage(
		chatId: string,
		role: 'user' | 'assistant' | 'system',
		content: string,
		status: 'sent' | 'idle' | 'streaming' | 'done' | 'error' = 'sent',
		images: string[] = []
	): Promise<string> {
		const db = await getDatabase();
		const messageId = crypto.randomUUID();

		// Fetch chat to get the correct model
		const chat = await this.getChat(chatId);

		await db.messages.insert({
			message_id: messageId,
			chat_id: chatId,
			role,
			content,
			status,
			images,
			created_at: Date.now(),
			model: chat?.model || userState.preferences.defaultModel
		});

		// Update chat updated_at
		if (chat) {
			await chat.patch({
				updated_at: Date.now()
			});
		}

		return messageId;
	}

	async updateMessage(messageId: string, content: string, status?: 'sent' | 'idle' | 'streaming' | 'done' | 'error') {
		const db = await getDatabase();
		const message = await db.messages.findOne(messageId).exec();
		if (message) {
			const updateData: { content: string; status?: string } = { content };
			if (status) updateData.status = status;
			await message.patch(updateData);
		}
	}

	async generateResponse(
		chatId: string,
		messageHistory: { role: string; content: string; images?: string[] }[],
		existingMessageId?: string
	) {
		const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');

		let assistantMsgId: string;

		if (existingMessageId) {
			assistantMsgId = existingMessageId;
			await this.updateMessage(assistantMsgId, '', 'streaming');
		} else {
			// Create a placeholder message for the assistant
			assistantMsgId = await this.addMessage(chatId, 'assistant', '', 'streaming');
		}

		// Fetch chat to get system prompt
		const chat = await this.getChat(chatId);
		let systemPrompt = '';
		if (chat) {
			systemPrompt = chat.system_prompt || '';

			// Inject Mood if companion exists
			if (chat.companion_id) {
				const db = await getDatabase();
				let companion = await db.user_companions.findOne(chat.companion_id).exec();
				if (!companion) {
					companion = await db.companions.findOne(chat.companion_id).exec();
				}

				if (companion) {
					// Use the companion's current system prompt to ensure we have the latest version
					// and to fix issues where the chat might have been created with the wrong prompt.
					if (companion.system_prompt) {
						systemPrompt = companion.system_prompt;
					}

					/* if (companion.mood && companion.mood !== 'neutral') {
						systemPrompt += `\n\nIMPORTANT: You are currently in a '${companion.mood}' mood. Your responses must reflect this emotion strongly.`;
					} */
				}
			}
		}

		// Prepare messages for Ollama: strip base64 prefix from images
		const ollamaMessages = messageHistory.map((msg) => {
			const newMsg: { role: string; content: string; images?: string[] } = { role: msg.role, content: msg.content };
			if (msg.images && msg.images.length > 0) {
				newMsg.images = msg.images.map((img) => {
					// Remove data URI prefix if present (supports images and other files if supported by model)
					return img.replace(/^data:[\w-]+\/[\w-.+]+;base64,/, '');
				});
			}
			return newMsg;
		});

		// Prepend system prompt if available
		if (systemPrompt) {
			ollamaMessages.unshift({ role: 'system', content: systemPrompt });
		}

		// Retry logic with exponential backoff
		const maxRetries = 3;
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const response = await fetch(`${serverUrl}/api/chat/generate`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						model: chat?.model || userState.preferences.defaultModel,
						messages: ollamaMessages,
						stream: true,
						context: contextState.getPayload()
					})
				});

				if (!response.ok) {
					let errorMessage = 'Generation failed';
					try {
						const errorData = await response.json();
						if (errorData?.error?.message) {
							errorMessage = errorData.error.message;
						}
					} catch {
						// Ignore JSON parse error
					}
					throw new Error(errorMessage);
				}

				if (!response.body) throw new Error('No response body');

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let fullContent = '';

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					// Parse NDJSON (Newline Delimited JSON)
					const lines = chunk.split('\n').filter((line) => line.trim() !== '');

					for (const line of lines) {
						try {
							const json = JSON.parse(line);

							// Handle error in stream
							if (json.error) {
								throw new Error(json.error);
							}

							if (json.message?.content) {
								fullContent += json.message.content;
								// Update UI/DB progressively
								// Optimization: Maybe don't write to DB on every chunk if it's too fast,
								// but for now let's try direct updates.
								await this.updateMessage(assistantMsgId, fullContent, 'streaming');
							}
							if (json.done) {
								await this.updateMessage(assistantMsgId, fullContent, 'done');
								if (!toast.isFocused) {
									toast.info(t('chat.response_received') || 'Response received');
								}
								// Trigger metadata update in background
								MetadataService.updateChatMetadata(chatId).catch((err) =>
									console.error('Metadata update failed', err)
								);
							}
						} catch (e) {
							if (e instanceof Error && e.message !== 'JSON.parse') {
								throw e;
							}
							console.error('Error parsing chunk', e);
						}
					}
				}

				return fullContent;
			} catch (err) {
				lastError = err as Error;
				const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s

				if (attempt < maxRetries - 1) {
					console.warn(`Generation attempt ${attempt + 1} failed, retrying in ${waitTime}ms:`, err);
					await new Promise((resolve) => setTimeout(resolve, waitTime));
				} else {
					console.error('Max retries reached for generation');
				}
			}
		}

		// All retries failed
		if (lastError) {
			console.error('Generation failed after retries:', lastError);
			const errorMessage = lastError instanceof Error ? lastError.message : 'Error generating response after retries.';
			toast.error(errorMessage);
			await this.updateMessage(assistantMsgId, errorMessage, 'error');
			throw lastError;
		}

		throw new Error('Generation failed');
	}

	async search(
		query: string,
		filters: { chatName: boolean; messageContent: boolean; assistantName: boolean },
		sortOrder: 'asc' | 'desc' = 'desc'
	) {
		const db = await getDatabase();
		const userId = userState.uid || 'anonymous';
		let allResults: any[] = [];
		const regex = new RegExp(query, 'i');

		// 1. Search Chats by Title
		if (filters.chatName) {
			const chats = await db.chats
				.find({
					selector: {
						user_id: userId,
						title: { $regex: regex }
					}
				})
				.exec();
			allResults.push(...chats.map((c: any) => ({ type: 'chat', data: c.toJSON(), date: c.updated_at })));
		}

		// 2. Search Messages
		if (filters.messageContent) {
			const messages = await db.messages
				.find({
					selector: {
						content: { $regex: regex }
					}
				})
				.exec();

			for (const m of messages) {
				const msgData = m.toJSON();
				const chat = await db.chats.findOne(msgData.chat_id).exec();
				if (chat && chat.user_id === userId) {
					allResults.push({ type: 'message', data: msgData, chat: chat.toJSON(), date: msgData.created_at });
				}
			}
		}

		// 3. Search by Assistant Name
		if (filters.assistantName) {
			const companions = await db.companions
				.find({
					selector: {
						name: { $regex: regex }
					}
				})
				.exec();

			const userCompanions = await db.user_companions
				.find({
					selector: {
						name: { $regex: regex },
						user_id: userId
					}
				})
				.exec();

			const companionIds = [
				...companions.map((c: any) => c.companion_id),
				...userCompanions.map((c: any) => c.user_companion_id)
			];
			if (companionIds.length > 0) {
				const chats = await db.chats
					.find({
						selector: {
							user_id: userId,
							companion_id: { $in: companionIds }
						}
					})
					.exec();

				for (const chat of chats) {
					const chatData = chat.toJSON();
					const companion = companions.find((c: any) => c.companion_id === chatData.companion_id);
					allResults.push({
						type: 'chat_assistant',
						data: chatData,
						date: chatData.updated_at,
						assistant: companion ? companion.toJSON() : null
					});
				}
			}
		}

		// Deduplicate results
		const uniqueResults = new Map();
		for (const item of allResults) {
			let id;
			if (item.type === 'message') {
				id = item.data.message_id;
			} else {
				id = item.data.chat_id;
			}

			const key = item.type === 'message' ? `msg-${id}` : `chat-${id}`;

			if (!uniqueResults.has(key)) {
				uniqueResults.set(key, item);
			}
		}

		allResults = Array.from(uniqueResults.values());

		// Sort
		allResults.sort((a, b) => {
			const dateA = new Date(a.date).getTime();
			const dateB = new Date(b.date).getTime();
			return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
		});

		return allResults;
	}
}

export const chatService = new ChatService();
