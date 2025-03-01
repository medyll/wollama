import { idbQuery } from "$lib/db/dbQuery";
import type { DbChat, DBMessage, MessageImageType } from "$types/db";
import { OllamaChatMessageRole, type OllamaChatMessage } from "$types/ollama";

export class ChatSessionManager {
  #sessionId?: number;
  #SessionDB: {
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
    userDbMessage: {} as DBMessage,
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

  public async setPreviousMessages(): Promise<Partial<DBMessage>[]> {
    let chatList = await idbQuery.getMessages(this.sessionId);

    this.previousMessages = chatList.map((e) => ({
      content: e.content,
      role: e.role,
      images: e?.images?.base64,
    }));

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
    model,
  }: {
    model?: string;
    content: string;
    images?: MessageImageType;
  }) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urs = content.match(urlRegex);
    let urls: DBMessage["urls"] = urs ? urs : [];

    const messageData = {
      chatId: this.sessionId,
      content,
      images,
      role: "user",
      status: "done",
      urls,
      //
      model: model ?? this.#SessionDB.dbChat.models?.[0],
    };

    this.#SessionDB.userDbMessage = await idbQuery.insertMessage(
      this.#sessionId,
      messageData
    );

    return this.#SessionDB.userDbMessage;
  }

  async createAssistantMessage(model: string) {
    const messageData = {
      chatId: this.#sessionId,
      model,
      role: "assistant",
      status: "idle",
    };
    const assistantsDbMessages = await idbQuery.insertMessage(
      this.#sessionId,
      messageData
    );

    console.log("created :", assistantsDbMessages);

    return assistantsDbMessages;
  }

  async createUserChatMessage({
    content,
    images,
    model,
  }: {
    model?: string;
    content: string;
    images?: MessageImageType;
  }) {
    // format message for chat send
    this.#SessionDB.userChatMessage = {
      content: content,
      role: OllamaChatMessageRole.USER,
      images: images?.base64 ? [images?.base64] : undefined,
    };

    return this.#SessionDB.userChatMessage;
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

  /**
   * Handles the completion of a message in the chat session.
   * @param assistantMessage - The assistant message object.
   * @param data - The response data from the assistant.
   */
  public async onMessageDone(
    assistantMessage: DBMessage,
    data: OllamaResponse
  ) {
    await Promise.all([
      //idbQuery.updateChat(assistantMessage.chatId, { context: data?.context }),
      idbQuery.updateMessage(assistantMessage.id, { status: "done" }),
    ]);
  }

  /**
   * Handles the incoming message stream from the assistant.
   * @param assistantMessage - The message object received from the assistant.
   * @param data - The response data received from the assistant.
   */
  public async onMessageStream(
    assistantMessage: DBMessage,
    data: OllamaResponse
  ) {
    await idbQuery.updateMessageStream(assistantMessage.id, data);
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
