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
  #type: "generate" | "chat" = "chat";
  #useContext = false;

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

  get getChatSessionDB() {
    return {
      create: this.#createChatSessionInDB.bind(this),
      updateChat: this.#updateChatSessionInDB.bind(this),
    };
  }

  async #createChatSessionInDB(chatData: Partial<DbChat> = {} as DbChat) {
    this.#SessionDB.dbChat = await this.initChatDb(
      this.#sessionId,
      chatData as DbChat
    );
    this.#sessionId = this.#SessionDB.dbChat.id;
  }

  async #updateChatSessionInDB(chatData: Partial<DbChat> = {} as DbChat) {
    if (this.#SessionDB.dbChat.id !== undefined) {
      this.#SessionDB.dbChat = await idbQuery.updateChat(
        this.#SessionDB.dbChat.id,
        {
          ...(chatData as DbChat),
        } as DbChat
      );
    } else {
      throw new Error("Chat ID is undefined");
    }
  }

  async initChatDb(
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
}
