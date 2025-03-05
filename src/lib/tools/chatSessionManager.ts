import { dbQuery, idbQuery } from '$lib/db/dbQuery';
import type { GenerateResponseHook } from '$lib/db/wollamaApi';
import { type ChatParameters, chatParametersState } from '$lib/states/chat.svelte';
import type { DbChat, DBMessage } from '$types/db';
import { type OllamaChatMessage, OllamaChatMessageRole, type OllamaResponse } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { Message } from 'ollama/browser';

export class ChatSessionManager {
	#SessionDB:              {
		sessionId:        number | undefined;
		dbChat:           Partial<DbChat>;
		models?:          string[];
		userChatMessage?: OllamaChatMessage;
		userDbMessage?:   DBMessage;
		messageAssistant: DBMessage[];
		messageUser:      Partial<DBMessage>;
	} = {
		sessionId:        undefined,
		dbChat:           {},
		models:           [],
		messageAssistant: [],
		messageUser:      {},
		userChatMessage:  {} as OllamaChatMessage,
		userDbMessage:    {} as DBMessage
	};
	chatParametersState!:     ChatParameters;
	public previousMessages: DBMessage[] = [];

	private constructor(id?: number) {
		if (id) {
			this.#loadChatSessionFromDB(id);
		}
	}

	static loadSession() {
		return new ChatSessionManager();
	}

	setParameters(parameters: ChatParameters) {
		this.chatParametersState = parameters;
	}

	async #loadChatSessionFromDB(id: number) {
		const dbChat = await dbQuery('chat').getOne(id);
		this.#SessionDB.dbChat = dbChat ?? ({} as Partial<DbChat>);
		this.#SessionDB.sessionId = dbChat?.id;
	}

	async #initChatDb(sessionId?: number, chatData: DbChat = {} as DbChat): Promise<Partial<DbChat>> {
		let ret: Partial<DbChat>;
		if (sessionId && Boolean(await dbQuery('chat').getOne(sessionId))) {
			ret = await idbQuery.updateChat(sessionId, chatData);
		} else {
			ret = await idbQuery.insertChat(chatData);
		}
		return ret;
	}

	async #createChatSessionDB(chatData: Partial<DbChat> = {} as DbChat) {
		this.#SessionDB.dbChat = await this.#initChatDb(this.sessionId, chatData as DbChat);
		this.#SessionDB.sessionId = this.#SessionDB.dbChat.id;
		return { sessionId: this.sessionId, dbChat: this.#SessionDB.dbChat };
	}

	async #updateChatSessionDB(chatData: Partial<DbChat> = {} as DbChat) {
		if (this.#SessionDB.dbChat.id !== undefined) {
			this.#SessionDB.dbChat = await idbQuery.updateChat(this.#SessionDB.dbChat.id, {
				...(chatData as DbChat)
			} as DbChat);
			this.#SessionDB.sessionId = this.#SessionDB.dbChat.id;
			return { sessionId: this.sessionId, dbChat: this.#SessionDB.dbChat };
		}
		return undefined;
	}

	async loadFromPathKey(pathKey?: string) {
		const dbChat = await idbQuery.getChatByPassKey(pathKey);

		this.#SessionDB.dbChat = dbChat ?? ({} as Partial<DbChat>);
		this.#SessionDB.sessionId = dbChat?.id;
		await this.#loadChatSessionFromDB(dbChat?.id);
		return dbChat;
	}

	static #convertMessage<T extends 'MessageToDbMessage' | 'DbMessageToMessage'>(
		from: T,
		message: T extends 'MessageToDbMessage' ? Message : DBMessage
	): T extends 'MessageToDbMessage' ? DBMessage : Message {
		if (from === 'MessageToDbMessage') {
			const msg = message as Message;
			return {
				...msg,
				created_at: new Date(),
				images:     msg.images ? { base64: msg.images[0] } : undefined,
				role:       msg.role as 'system' | 'user' | 'tool' | 'assistant'
			} as unknown as T extends 'MessageToDbMessage' ? DBMessage : Message;
		} else {
			const dbMsg = message as DBMessage;
			return {
				role:    dbMsg.role,
				content: dbMsg.content,
				images:  dbMsg.images ? [dbMsg.images.base64] : undefined
			} as unknown as T extends 'MessageToDbMessage' ? DBMessage : Message;
		}
	}

	static #dbMessageToMessage(dbMessage: DBMessage): Message {
		return {
			role:       dbMessage.role,
			content:    dbMessage.content,
			images:     dbMessage.images?.base64 ? [dbMessage.images.base64] : [],
			tool_calls: []
		};
	}

	get ChatSessionDB() {
		return {
			createSession: this.#createChatSessionDB.bind(this),
			updateSession: this.#updateChatSessionDB.bind(this)
			/*  init: this.#initChatDb.bind(this), */
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
			sessionId:        undefined,
			dbChat:           {},
			messageAssistant: [],
			messageUser:      {}
		};
	}

	public async buildMessages(
		chatParams: ChatParameters,
		config: SettingsType | undefined
	): Promise<{
		systemMessage:    Message;
		previousMessages: Message[];
		userChatMessage:  Message;
	}> {
		const systemPrompt = chatParams.promptSystem.value ?? config?.system_prompt;

		const previousMessages = await this.getPreviousMessages();

		const userChatMessage: Message = {
			role:       OllamaChatMessageRole.USER,
			content:    chatParams.prompt,
			images:     chatParams.images?.base64 ? [chatParams.images?.base64] : [],
			tool_calls: []
		};

		let systemMessage: Message = {
			role:       OllamaChatMessageRole.SYSTEM,
			content:    systemPrompt,
			images:     [],
			tool_calls: []
		};
		const existingSystemMessage = await idbQuery.getSystemMessage(this.sessionId);
		if (existingSystemMessage) {
			systemMessage = {
				role:       existingSystemMessage.role,
				content:    existingSystemMessage.content,
				images:     [],
				tool_calls: []
			};
		}

		if (!existingSystemMessage) {
			await this.createDbMessage(OllamaChatMessageRole.SYSTEM, {
				...systemMessage,
				status: 'idle',
				model:  chatParams.models[0],
				images: []
			});
		}
		await this.createDbMessage(OllamaChatMessageRole.USER, userChatMessage);

		return {
			systemMessage:    systemMessage,
			previousMessages: previousMessages.map((e) => ChatSessionManager.#dbMessageToMessage(e)).filter((e) => e.role !== 'system'),
			userChatMessage
		};
	}

	public async getPreviousMessages(): Promise<Partial<DBMessage>[]> {
		const chatList = await dbQuery('messages').getBy(this.sessionId,'chatId');

		this.previousMessages = chatList.map((e) => e);

		return this.previousMessages;
	}

	async createDbMessage(
		role: OllamaChatMessageRole | string,
		message: Message & {
			chatId?: number;
			status?: DBMessage['status'];
			model?:  string;
		}
	) {
		const { status, chatId, model } = message;
		const messageData: Partial<DBMessage> = {
			...ChatSessionManager.#convertMessage('MessageToDbMessage', message),
			role:   role as OllamaChatMessageRole,
			chatId: chatId ?? this.sessionId,
			status: status ?? 'idle',
			model:  model ?? this.#SessionDB.dbChat.models?.[0]
		};

		return await idbQuery.insertMessage(this.sessionId, messageData);
	}

	/**
	 * Handles the completion of a message in the chat session.
	 * @param assistantMessage - The assistant message object.
	 * @param data - The response data from the assistant.
	 */
	public async onMessageDone(assistantMessage: DBMessage, data: GenerateResponseHook) {
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
	public async onMessageStream(assistantMessage: DBMessage, data: GenerateResponseHook) {
		await idbQuery.updateMessageStream(assistantMessage.id, data);
	}
}
