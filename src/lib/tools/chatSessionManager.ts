import { idbQuery } from '$lib/db/dbQuery';
import type { DbChat, DBMessage, MessageImageType } from '$types/db';
import { OllamaChatMessageRole, type OllamaChatMessage } from '$types/ollama';
import type { Message, ToolCall } from 'ollama/browser';

export class ChatSessionManager {
	#SessionDB: {
		sessionId?: number;
		dbChat: Partial<DbChat>;
		userChatMessage?: OllamaChatMessage;
		userDbMessage?: DBMessage;
		messageAssistant: DBMessage[];
		messageUser: Partial<DBMessage>;
	} = {
		dbChat: {},
		messageAssistant: [],
		messageUser: {},
		userChatMessage: {} as OllamaChatMessage,
		userDbMessage: {} as DBMessage
	};
	#sessionConfig: { apiType: 'generate' | 'chat'; useContext: boolean } = {
		apiType: 'generate',
		useContext: false
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
		return this.createDbMessage(OllamaChatMessageRole.SYSTEM, message);
	}

	#loadChatSessionFromDB = (id: number) => {
		idbQuery
			.getChat(id)
			.then((dbChat: DbChat | undefined) => {
				this.#SessionDB.dbChat = dbChat ?? ({} as Partial<DbChat>);
				this.#SessionDB.sessionId = dbChat?.id;
			})
			.catch((error) => {
				console.error('Error loading chat:', error);
			});
	};

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
			images: dbMessage.images ? [dbMessage.images.base64] : undefined
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
}
