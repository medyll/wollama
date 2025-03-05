import { idbQuery } from '$lib/db/dbQuery';
import type { ChatParameters } from '$lib/states/chat.svelte';
import type { DbChat, DBMessage, MessageImageType } from '$types/db';
import { type OllamaChatMessage, OllamaChatMessageRole, type OllamaResponse } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { Message } from 'ollama/browser';

export class ChatSessionManager {
	#SessionDB: {
		sessionId: number | undefined;
		dbChat: Partial<DbChat>;
		models?: string[];
		userChatMessage?: OllamaChatMessage;
		userDbMessage?: DBMessage;
		messageAssistant: DBMessage[];
		messageUser: Partial<DBMessage>;
	} = {
		sessionId       : undefined,
		dbChat          : {},
		models          : [],
		messageAssistant: [],
		messageUser     : {},
		userChatMessage : {} as OllamaChatMessage,
		userDbMessage   : {} as DBMessage
	};
	
	public previousMessages: DBMessage[] = [];
	public sessionManagerMessages!: ChatSessionManagerMessages;
	
	private constructor(id?: number) {
		if (id) {
			this.#loadChatSessionFromDB(id);
			this.sessionManagerMessages = new ChatSessionManagerMessages(id);
		}
	}
	
	public async getPreviousMessages(): Promise<Partial<DBMessage>[]> {
		const chatList = await idbQuery.getMessages(this.sessionId);
		
		this.previousMessages = chatList.map((e) => e);
		
		return this.previousMessages;
	}
	
 
	
	async createDbMessage(
		role: OllamaChatMessageRole | string,
		message: Message & {
			chatId?: number;
			status?: DBMessage['status'];
			model?: string;
		}
	) {
		const { status, chatId, model }       = message;
		const messageData: Partial<DBMessage> = {
			...ChatSessionManager.convertMessage('MessageToDbMessage', message),
			role  : role as OllamaChatMessageRole,
			chatId: chatId ?? this.sessionId,
			status: status ?? 'idle',
			model : model ?? this.#SessionDB.dbChat.models?.[0]
		};
		
		return await idbQuery.insertMessage(this.sessionId, messageData);
	}
	
 
	
	#loadChatSessionFromDB = async (id: number) => {
		const dbChat              = await idbQuery.getChat(id);
		this.#SessionDB.dbChat    = dbChat ?? ({} as Partial<DbChat>);
		this.#SessionDB.sessionId = dbChat?.id;
	};
	
	async loadFromPathKey(pathKey?: string) {
		const dbChat = await idbQuery.getChatByPassKey(pathKey);
		
		this.#SessionDB.dbChat    = dbChat ?? ({} as Partial<DbChat>);
		this.#SessionDB.sessionId = dbChat?.id;
		await this.#loadChatSessionFromDB(dbChat?.id);
		return dbChat;
	}
	
	static loadSession() {
		return new ChatSessionManager();
	}
	
	get ChatSessionDB() {
		return {
			createSession: this.#createChatSessionInDB.bind(this),
			updateSession: this.#updateChatSessionInDB.bind(this)
			/*  init: this.#initChatDb.bind(this), */
		};
	}
	
	async #createChatSessionInDB(chatData: Partial<DbChat> = {} as DbChat) {
		this.#SessionDB.dbChat    = await this.#initChatDb(this.sessionId, chatData as DbChat);
		this.#SessionDB.sessionId = this.#SessionDB.dbChat.id;
		return { sessionId: this.sessionId, dbChat: this.#SessionDB.dbChat };
	}
	
	async #updateChatSessionInDB(chatData: Partial<DbChat> = {} as DbChat) {
		if (this.#SessionDB.dbChat.id !== undefined) {
			this.#SessionDB.dbChat    = await idbQuery.updateChat(this.#SessionDB.dbChat.id, {
				...(chatData as DbChat)
			} as DbChat);
			this.#SessionDB.sessionId = this.#SessionDB.dbChat.id;
			return { sessionId: this.sessionId, dbChat: this.#SessionDB.dbChat };
		}
		return undefined;
	}
	
	/**
	 * Handles the completion of a message in the chat session.
	 * @param assistantMessage - The assistant message object.
	 * @param data - The response data from the assistant.
	 */
	public async onMessageDone(assistantMessage: DBMessage, data: OllamaResponse) {
		await Promise.all([
			//idbQuery.updateChat(assistantMessage.chatId, { context: data?.context }),
			idbQuery.updateMessage(assistantMessage.id, { status: 'done' })
		]);
	}
	
	/**
	 * Handles the incoming message stream from the assistant.
	 * @param assistantMessage - The message object received from the assistant.
	 * @param data - The response data received from the assistant.
	 */
	public async onMessageStream(assistantMessage: DBMessage, data: OllamaResponse) {
		await idbQuery.updateMessageStream(assistantMessage.id, data);
	}
	
	async #initChatDb(sessionId?: number, chatData: DbChat = {} as DbChat): Promise<DbChat> {
		let ret: DbChat;
		if (sessionId && Boolean(await idbQuery.getChat(sessionId))) {
			ret = await idbQuery.updateChat(sessionId, chatData);
		} else {
			ret = await idbQuery.insertChat(chatData);
		}
		return ret;
	}
	
	static convertMessage<T extends 'MessageToDbMessage' | 'DbMessageToMessage'>(
		from: T,
		message: T extends 'MessageToDbMessage' ? Message : DBMessage
	): T extends 'MessageToDbMessage' ? DBMessage : Message {
		if (from === 'MessageToDbMessage') {
			const msg = message as Message;
			return {
				...msg,
				created_at: new Date(),
				images    : msg.images ? { base64: msg.images[0] } : undefined,
				role      : msg.role as 'system' | 'user' | 'tool' | 'assistant'
			} as unknown as T extends 'MessageToDbMessage' ? DBMessage : Message;
		} else {
			const dbMsg = message as DBMessage;
			return {
				role   : dbMsg.role,
				content: dbMsg.content,
				images : dbMsg.images ? [dbMsg.images.base64] : undefined
			} as unknown as T extends 'MessageToDbMessage' ? DBMessage : Message;
		}
	}
	
	static dbMessageToMessage(dbMessage: DBMessage): Message {
		return {
			role      : dbMessage.role,
			content   : dbMessage.content,
			images    : dbMessage.images?.base64 ? [dbMessage.images.base64] : [],
			tool_calls: []
		};
	}
	
	
	get sessionId() {
		return this.#SessionDB.sessionId;
	}
	
	get session() {
		return this.#SessionDB;
	}
	
	/**
	 * Clears the current session data.
	 */
	clearSession() {
		this.#SessionDB = {
			sessionId       : undefined,
			dbChat          : {},
			messageAssistant: [],
			messageUser     : {}
		};
	}
	
	public async buildMessages(
		chatParams: ChatParameters,
		config: SettingsType | undefined
	): Promise<{
		systemMessage: Message;
		previousMessages: Message[];
		userChatMessage: Message;
	}> {
		const systemPrompt = chatParams.promptSystem.value ?? config?.system_prompt;
		
		const previousMessages = await this.getPreviousMessages();
		
		const userChatMessage: Message = {
			role   : OllamaChatMessageRole.USER,
			content: chatParams.prompt,
			images : chatParams.images?.base64 ? [chatParams.images?.base64] : [],
			tool_calls: []
		};
		
		let systemMessage: Message = {
			role   : OllamaChatMessageRole.SYSTEM,
			content: systemPrompt,
			images :   [],
			tool_calls: []
		};
		const existingSystemMessage = await idbQuery.getSystemMessage(this.sessionId);
		if (existingSystemMessage) {
			systemMessage = {
				role   : existingSystemMessage.role,
				content: existingSystemMessage.content,
				images :   [],
				tool_calls: []
			};
		}
		
		if (!existingSystemMessage) {
			await this.createDbMessage(OllamaChatMessageRole.SYSTEM, {
				...systemMessage,
				status : 'idle',
				model  : chatParams.models[0],
				images : []
			});
		}
		await this.createDbMessage(OllamaChatMessageRole.USER, userChatMessage);
		
		return {
			systemMessage   : systemMessage,
			previousMessages: previousMessages
			.map((e) => ChatSessionManager.dbMessageToMessage(e))
			.filter((e) => e.role !== 'system'),
			userChatMessage
		};
	}
}


class ChatSessionManagerMessages extends ChatSessionManager {
	
	#SessionDB;
	
	constructor(chatID: number) {
		super(chatID);
		
	}
	
	async createUserChatMessage({
									content,
									images,
									model
								}: {
		model?: string;
		content: string;
		images?: MessageImageType;
	}) {
		// format message for chat send
		this.#SessionDB.userChatMessage = {
			content: content,
			role   : OllamaChatMessageRole.USER,
			images : images?.base64 ? [images?.base64] : []
		};
		
		return this.#SessionDB.userChatMessage;
		
		
	}
	
	async createDbMessage(
		role: OllamaChatMessageRole | string,
		message: Message & {
			chatId?: number;
			status?: DBMessage['status'];
			model?: string;
		}
	) {
		const { status, chatId, model }       = message;
		const messageData: Partial<DBMessage> = {
			...ChatSessionManager.convertMessage('MessageToDbMessage', message),
			role  : role as OllamaChatMessageRole,
			chatId: chatId ?? this.sessionId,
			status: status ?? 'idle',
			model : model ?? this.#SessionDB.dbChat.models?.[0]
		};
		
		return await idbQuery.insertMessage(this.sessionId, messageData);
	}
	
	async createDbSystemMessage(
		message: Message & {
			chatId?: number;
			status: DBMessage['status'];
			model: string;
		}
	): Promise<DBMessage> {
		const existingSystemMessage = await idbQuery.getSystemMessage(this.sessionId);
		if (existingSystemMessage) {
			return existingSystemMessage;
		}
		const createdMessage = await this.createDbMessage(OllamaChatMessageRole.SYSTEM, message);
		return createdMessage;
	}
	
}