import { idbQuery } from '$lib/db/dbQuery';
import type { ChatGenerate } from '$lib/states/chat.svelte';
import type { DbChat, DBMessage, MessageImageType } from '$types/db';
import { OllamaChatMessageRole, type OllamaChatMessage, type OllamaResponse } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { Message, ToolCall } from 'ollama/browser';

export class ChatSessionManager {
	#SessionDB: {
		sessionId?: number;
		dbChat: Partial<DbChat>;
		models?: string[];
		userChatMessage?: OllamaChatMessage;
		userDbMessage?: DBMessage;
		messageAssistant: DBMessage[];
		messageUser: Partial<DBMessage>;
	} = {
		dbChat: {},
		models: [],
		messageAssistant: [],
		messageUser: {},
		userChatMessage: {} as OllamaChatMessage,
		userDbMessage: {} as DBMessage
	};

	public previousMessages: DBMessage[] = [];

	private constructor(id?: number) {
		if (id) {
			this.#loadChatSessionFromDB(id);
		}
	}

	public async getPreviousMessages(): Promise<Partial<DBMessage>[]> {
		let chatList = await idbQuery.getMessages(this.sessionId);

		this.previousMessages = chatList.map((e) => e);

		return this.previousMessages;
	}
	/**
	 * Creates a user message in the chat session.
	 *
	 * @param content - The content of the message.
	 * @param images - Optional images to be attached to the message.
	 * @returns A Promise that resolves to the created user message.
	 */
	async createUserDbMessage({
		content,
		images,
		model
	}: {
		model?: string;
		content: string;
		images?: MessageImageType;
	}) {
		const urlRegex = /https?:\/\/[^\s]+/g;
		const urs = content.match(urlRegex);
		let urls: DBMessage['urls'] = urs ? urs : [];

		const messageData = {
			chatId: this.sessionId,
			content,
			images,
			role: 'user',
			status: 'done',
			urls,
			//
			model: model ?? this.#SessionDB.dbChat.models?.[0]
		};

		this.#SessionDB.userDbMessage = await idbQuery.insertMessage(this.sessionId, messageData);

		return this.#SessionDB.userDbMessage;
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
			role: OllamaChatMessageRole.USER,
			images: images?.base64 ? [images?.base64] : []
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
		const { status, chatId, model } = message;
		const messageData: Partial<DBMessage> = {
			...ChatSessionManager.convertMessage('MessageToDbMessage', message),
			role: role as OllamaChatMessageRole,
			chatId: chatId ?? this.sessionId,
			status: status ?? 'idle',
			model: model ?? this.#SessionDB.dbChat.models?.[0]
		};

		return await idbQuery.insertMessage(this.sessionId, messageData);
	}

	async createSystemMessage(
		message: Message & {
			chatId?: number;
			status: DBMessage['status'];
			model: string;
		}
	) {
		const existingSystemMessage = await idbQuery.getSystemMessage(this.sessionId);
		if (existingSystemMessage) {
			return existingSystemMessage;
		}
		const createdMessage = await this.createDbMessage(OllamaChatMessageRole.SYSTEM, message);
		return await ChatSessionManager.dbMessageToMessage(createdMessage);
	}

	#loadChatSessionFromDB = async (id: number) => {
		const dbChat = await idbQuery.getChat(id);
		this.#SessionDB.dbChat = dbChat ?? ({} as Partial<DbChat>);
		this.#SessionDB.sessionId = dbChat?.id;
	};

	async loadFromPathKey(pathKey?: string) {
		const dbChat = await idbQuery.getChatByPassKey(pathKey);

		this.#SessionDB.dbChat = dbChat ?? ({} as Partial<DbChat>);
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
		this.#SessionDB.dbChat = await this.#initChatDb(this.sessionId, chatData as DbChat);
		this.#SessionDB.sessionId = this.#SessionDB.dbChat.id;
		return { sessionId: this.sessionId, dbChat: this.#SessionDB.dbChat };
	}

	async #updateChatSessionInDB(chatData: Partial<DbChat> = {} as DbChat) {
		if (this.#SessionDB.dbChat.id !== undefined) {
			this.#SessionDB.dbChat = await idbQuery.updateChat(this.#SessionDB.dbChat.id, {
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
				images: msg.images ? { base64: msg.images[0] } : undefined,
				role: msg.role as 'system' | 'user' | 'tool' | 'assistant'
			} as unknown as T extends 'MessageToDbMessage' ? DBMessage : Message;
		} else {
			const dbMsg = message as DBMessage;
			return {
				role: dbMsg.role,
				content: dbMsg.content,
				images: dbMsg.images ? [dbMsg.images.base64] : undefined
			} as unknown as T extends 'MessageToDbMessage' ? DBMessage : Message;
		}
	}

	static messageToDbMessage(
		message: Message,
		chatId: number,
		status: DBMessage['status'],
		model: string
	): DBMessage {
		return {
			id: 0, // This should be set by the database
			chatId: chatId,
			content: message.content,
			created_at: new Date(),
			images: message.images ? { base64: message.images[0] } : undefined,
			status: status,
			context: [],
			resume: '',
			model: model,
			ia_lock: false,
			role: message.role as 'system' | 'user' | 'tool' | 'assistant'
		};
	}

	static dbMessageToMessage(dbMessage: DBMessage): Message {
		return {
			role: dbMessage.role,
			content: dbMessage.content,
			images: dbMessage.images?.base64 ? [dbMessage.images.base64] : [],
			tool_calls: []
		};
	}

	get Db() {
		return this.#SessionDB;
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
			sessionId: undefined,
			dbChat: {},
			messageAssistant: [],
			messageUser: {}
		};
	}

	public async buildMessages(
		chatParams: ChatGenerate,
		config: SettingsType | undefined
	): Promise<{
		systemMessage: Message;
		previousMessages: Partial<Message>[];
		userChatMessage: Message;
	}> {
		const systemPrompt = chatParams.promptSystem.value ?? config?.system_prompt;

		const userChatMessage: Message = await this.createUserChatMessage({
			content: chatParams.prompt,
			images: chatParams.images,
			model: chatParams.models[0]
		});

		const systemMessage = await this.createSystemMessage({
			content: systemPrompt,
			role: OllamaChatMessageRole.SYSTEM,
			status: 'idle',
			model: chatParams.models[0],
			images: []
		});

		const previousMessages = await this.getPreviousMessages();
		console.log({ systemMessage });
		return {
			systemMessage: ChatSessionManager.dbMessageToMessage(systemMessage),
			previousMessages: previousMessages
				.map((e) => ChatSessionManager.dbMessageToMessage(e))
				.filter((e) => e.role !== 'system'),
			userChatMessage
		};
	}
}
