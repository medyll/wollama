import { getDatabase } from '$lib/db';
import { userState } from '$lib/state/user.svelte';

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
                const companion = await db.companions.findOne(companionId).exec();
                if (companion) {
                    systemPrompt = companion.system_prompt;
                }
            }

            const chatData: Record<string, unknown> = {
                chat_id: chatId,
                user_id: userId,
                title,
                model,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
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
        return db.messages.find({
            selector: {
                chat_id: chatId
            },
            sort: [{ created_at: 'asc' }]
        }).exec();
    }

    async addMessage(chatId: string, role: 'user' | 'assistant' | 'system', content: string, status: 'sent' | 'idle' | 'streaming' | 'done' | 'error' = 'sent', images: string[] = []): Promise<string> {
        const db = await getDatabase();
        const messageId = crypto.randomUUID();

        await db.messages.insert({
            message_id: messageId,
            chat_id: chatId,
            role,
            content,
            status,
            images,
            created_at: new Date().toISOString(),
            model: userState.preferences.defaultModel
        });

        // Update chat updated_at
        const chat = await this.getChat(chatId);
        if (chat) {
            await chat.patch({
                updated_at: new Date().toISOString()
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

    async generateResponse(chatId: string, messageHistory: { role: string; content: string; images?: string[] }[]) {
        const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
        
        // Create a placeholder message for the assistant
        const assistantMsgId = await this.addMessage(chatId, 'assistant', '', 'streaming');

        // Fetch chat to get system prompt
        const chat = await this.getChat(chatId);
        let systemPrompt = '';
        if (chat) {
            systemPrompt = chat.system_prompt || '';
            
            // Inject Mood if companion exists
            if (chat.companion_id) {
                const db = await getDatabase();
                const companion = await db.companions.findOne(chat.companion_id).exec();
                if (companion && companion.mood && companion.mood !== 'neutral') {
                    systemPrompt += `\n\nIMPORTANT: You are currently in a '${companion.mood}' mood. Your responses must reflect this emotion strongly.`;
                }
            }
        }

        // Prepare messages for Ollama: strip base64 prefix from images
        const ollamaMessages = messageHistory.map(msg => {
            const newMsg: { role: string; content: string; images?: string[] } = { role: msg.role, content: msg.content };
            if (msg.images && msg.images.length > 0) {
                newMsg.images = msg.images.map(img => {
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

        try {
            const response = await fetch(`${serverUrl}/api/chat/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: userState.preferences.defaultModel,
                    messages: ollamaMessages,
                    stream: true
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
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
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

        } catch (error) {
            console.error('Generation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error generating response.';
            await this.updateMessage(assistantMsgId, errorMessage, 'error');
            throw error;
        }
    }
}

export const chatService = new ChatService();
