import { qoolie, idbQuery } from '$lib/_old/db/dbQuery';
import type { DbChat, DBMessage } from '$types/db';

export class ChatSessionManager {
	#sessionId?:             number;
	#SessionDB:              {
		dbChat:           Partial<DbChat>;
		messageAssistant: DBMessage[];
		messageUser:      Partial<DBMessage>;
	} = {
		dbChat:           {},
		messageAssistant: [],
		messageUser:      {}
	};
	#type:                   'generate' | 'chat' = 'chat';
	#useContext = false;

	public previousMessages: DBMessage[] = [];

	private constructor(id?: number) {
		if (id) {
			this.#loadChatDBSession(id);
		}
	}

	#loadChatDBSession = (id: number) => {
		qoolie('chat')
			.getOne(id)
			.then((dbChat: DbChat | undefined) => {
				this.#SessionDB.dbChat = dbChat ?? ({} as Partial<DbChat>);
				this.#sessionId = dbChat?.id;
				console.log('chat loaded', this.#SessionDB.dbChat);
			})
			.catch((error) => {
				console.error('Error loading chat:', error);
			});
	};

	static load() {
		return new ChatSessionManager();
	}

	get ChatDBSession() {
		return {
			create: this.#createChatDbSession.bind(this),
			update: this.#updateChatDB.bind(this),
			init:   this.#initChatDb.bind(this)
		};
	}

	async #createChatDbSession(chatData: Partial<DbChat> = {} as DbChat) {
		this.#SessionDB.dbChat = await this.#initChatDb(this.#sessionId, chatData as DbChat);
		this.#sessionId = this.#SessionDB.dbChat.id;
	}

	async #updateChatDB(chatData: Partial<DbChat> = {} as DbChat) {
		if (this.#SessionDB.dbChat.id !== undefined) {
			this.#SessionDB.dbChat = await idbQuery.updateChat(this.#SessionDB.dbChat.id, {
				...(chatData as DbChat)
			} as DbChat);
		} else {
			throw new Error('Chat ID is undefined');
		}
	}

	async #initChatDb(sessionId?: number, chatData: DbChat = {} as DbChat): Promise<DbChat> {
		if (sessionId && Boolean(await qoolie('chat').getOne(sessionId))) {
			await idbQuery.updateChat(sessionId, chatData);
		}

		return sessionId && Boolean(await qoolie('chat').getOne(sessionId))
			? ((await qoolie('chat').getOne(sessionId)) as DbChat)
			: ((await idbQuery.insertChat(chatData)) as DbChat);
	}

	get Db() {
		return this.#SessionDB;
	}
}
