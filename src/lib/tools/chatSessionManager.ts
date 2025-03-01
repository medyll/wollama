import { idbQuery } from "$lib/db/dbQuery";
import type { DbChat, DBMessage } from "$types/db";

export class ChatSessionManager {
  #sessionId?: number;
  #SessionDB: {
    dbChat: Partial<DbChat>;
    messageAssistant: DBMessage[];
    messageUser: Partial<DBMessage>;
  } = {
    dbChat: {},
    messageAssistant: [],
    messageUser: {},
  };
  #sessionConfig: { apiType: "generate" | "chat"; useContext: boolean } = {
    apiType: "generate",
    useContext: false,
  };

  public previousMessages: DBMessage[] = [];

  private constructor(id?: number) {
    if (id) {
      this.#loadChatSessionFromDB(id);
    }
  }

  #loadChatSessionFromDB = (id: number) => {
    idbQuery
      .getChat(id)
      .then((dbChat: DbChat | undefined) => {
        this.#SessionDB.dbChat = dbChat ?? ({} as Partial<DbChat>);
        this.#sessionId = dbChat?.id;
        console.log("chat loaded", this.#SessionDB.dbChat);
      })
      .catch((error) => {
        console.error("Error loading chat:", error);
      });
  };

  static loadSession() {
    return new ChatSessionManager();
  }

  get ChatSessionDB() {
    return {
      createSession: this.#createChatSessionInDB.bind(this),
      updateSession: this.#updateChatSessionInDB.bind(this),
      /*  init: this.#initChatDb.bind(this), */
    };
  }

  async #createChatSessionInDB(chatData: Partial<DbChat> = {} as DbChat) {
    this.#SessionDB.dbChat = await this.#initChatDb(
      this.#sessionId,
      chatData as DbChat
    );
    this.#sessionId = this.#SessionDB.dbChat.id;
    return { sessionId: this.#sessionId, dbChat: this.#SessionDB.dbChat };
  }

  async #updateChatSessionInDB(chatData: Partial<DbChat> = {} as DbChat) {
    if (this.#SessionDB.dbChat.id !== undefined) {
      this.#SessionDB.dbChat = await idbQuery.updateChat(
        this.#SessionDB.dbChat.id,
        {
          ...(chatData as DbChat),
        } as DbChat
      );
    }
  }

  async #initChatDb(
    sessionId?: number,
    chatData: DbChat = {} as DbChat
  ): Promise<DbChat> {
    if (sessionId && Boolean(await idbQuery.getChat(sessionId))) {
      await idbQuery.updateChat(sessionId, chatData);
    }

    return sessionId && Boolean(await idbQuery.getChat(sessionId))
      ? ((await idbQuery.getChat(sessionId)) as DbChat)
      : ((await idbQuery.insertChat(chatData)) as DbChat);
  }

  get Db() {
    return this.#SessionDB;
  }
  get sessionId() {
    return this.#sessionId;
  }

  clearSession() {
    this.#SessionDB = {
      dbChat: {},
      messageAssistant: [],
      messageUser: {},
    };
    this.#sessionId = undefined;
  }
}
