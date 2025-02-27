import type { DbChat, DBMessage, PromptType } from "$types/db";
import type { OllamaResponse } from "$types/ollama";
import { chatUtils } from "$lib/tools/chatUtils";
import { idbqlState, schemeModelDb } from "./dbSchema";
import type { SettingsType } from "$types/settings";
import type { UserType } from "$types/user";
import { schemeModel } from "$lib/db/dbSchema";
import { getClientData } from "$types/getData";
import type { Where } from "@medyll/idae-idbql";

export function ideo(collection: keyof typeof schemeModelDb) {
  if (!idbqlState[collection])
    throw new Error(`Collection ${collection} not found`);
  return {
    get: getClientData({ table_name: collection, action: "get_one", data: {} }),
    getAll: getClientData({
      table_name: collection,
      action: "getAll",
      data: {},
    }),
    create: getClientData({
      table_name: collection,
      action: "create",
      data: {},
    }),
    delete: getClientData({
      table_name: collection,
      action: "delete",
      data: {},
    }),
    deleteWhere: getClientData({
      table_name: collection,
      action: "deleteWhere",
      data: {},
    }),
    update: getClientData({
      table_name: collection,
      action: "update",
      data: {},
    }),
    where: getClientData({ table_name: collection, action: "where", data: {} }),
    updateWhere: getClientData({
      table_name: collection,
      action: "updateWhere",
      data: {},
    }),
  };
}
export function dynQuery(collection: keyof typeof schemeModelDb) {
  if (!idbqlState[collection])
    throw new Error(`Collection ${collection} not found`);
  return {
    getOne: (id: any) =>
      idbqlState[collection].getOne(id, schemeModel[collection].keyPath),
    getAll: () => idbqlState[collection].getAll(),
    create: (data) => idbqlState[collection].put(data),
    delete: (id: string | number) => idbqlState[collection].delete(id),
    deleteWhere: (data) => idbqlState[collection].deleteWhere(data),
    update: (id: any, data) => idbqlState[collection].update(id, data),
    where: (where: Where) => idbqlState[collection].where(where),
    updateWhere: (where: Where, data) =>
      idbqlState[collection].updateWhere(where, data),
  };
}

export class idbQuery {
  /* chat */
  static getChat(chatId: string) {
    if (!chatId || !idbqlState?.chat) return undefined; // throw new Error('chatId is required');
    return idbqlState.chat.where({ chatId: { eq: chatId } })[0];
  }

  static getChats() {
    return idbqlState.chat.getAll();
  }

  static async insertChat(chatData?: DbChat): Promise<DbChat> {
    const newChat = chatUtils.getChatDataObject();

    await idbqlState.chat.add({ ...newChat, ...chatData });
    return { ...newChat, ...chatData };
  }

  static async deleteChat(chatId?: string): Promise<string> {
    if (!chatId) throw new Error("chatId is required");

    await idbqlState.messages.deleteWhere({ chatId: { eq: chatId } });
    await idbqlState.chat.delete(chatId);

    return chatId;
  }

  static async updateChat(chatId: string, chatData: Partial<DbChat>) {
    if (!chatId) throw new Error("chatId is required");

    await idbqlState.chat.update(chatId, chatData);
    return { chatId, ...chatData };
  }

  static async initChat(
    activeChatId?: string,
    chatData: DbChat = {} as DbChat
  ): Promise<DbChat> {
    if (Boolean(await idbQuery.getChat(activeChatId as string))) {
      await idbQuery.updateChat(activeChatId as string, chatData);
    }

    return activeChatId &&
      Boolean(await idbQuery.getChat(activeChatId as string))
      ? ((await idbQuery.getChat(activeChatId as string)) as DbChat)
      : ((await idbQuery.insertChat(chatData)) as DbChat);
  }

  /* Message */

  static async insertMessage(
    chatId: string,
    messageData: Partial<DBMessage>
  ): Promise<DBMessage> {
    if (!chatId) throw new Error("chatId is required");
    const message = chatUtils.getMessageDataObject({ chatId, ...messageData });
    await idbqlState.messages.add(message);
    console.log("insertMessage", message);
    return message;
  }

  static async updateMessage(
    messageId: string,
    messageData: Partial<DBMessage>
  ) {
    if (!messageId) throw new Error("messageId is required");
    //console.log('updateMessage', messageId);
    await idbqlState.messages.update(messageId, { messageId, ...messageData });
  }

  static async updateMessageStream(
    messageId: string,
    data: Partial<OllamaResponse>
  ) {
    //console.log('updateMessageStream', messageId);
    if (!messageId) throw new Error("messageId is required");
    const message = await idbQuery.getMessage(messageId);

    let content =
      (message?.content ?? "") +
      (data?.message?.content ?? data?.response ?? "");

    if (content)
      await idbQuery.updateMessage(messageId, {
        messageId,
        content,
        status: "streaming",
      });
  }

  static getMessage(messageId: string) {
    if (!messageId) throw new Error("messageId is required");
    return idbqlState.messages.where({ messageId: { eq: messageId } })[0];
    // return   idbqlState.messages.get(messageId);
  }

  static getMessages(chatId: string): DBMessage | [] | any {
    if (!chatId) return [];
    return idbqlState.messages
      .where({ chatId: { eq: chatId } })
      .sortBy({ createdAt: "asc" });
  }
  /* MessageStats */
  static async insertMessageStats(statsData: Partial<OllamaResponse>) {
    if (!statsData.messageId) throw new Error("messageId is required");
    const stats = chatUtils.getMessageStatsObject(statsData);
    await idbqlState.messageStats.add(stats);
  }
  /* Prompt */
  static async getPrompt(promptId: string) {
    if (!promptId) throw new Error("promptId is required");
    return await idbqlState.prompts.where("id").equals(promptId).first();
  }

  static getPrompts() {
    return idbqlState.prompts.getAll();
  }

  static async insertPrompt(promptData: Partial<PromptType>) {
    return await idbqlState.prompts.put(promptData as PromptType);
  }

  static async updatePrompt(id: number, promptData: Partial<PromptType>) {
    if (!id) throw new Error("id is required");
    return await idbqlState.prompts.update(id, promptData);
  }

  static async deletePrompt(promptId: number) {
    if (!promptId) throw new Error("promptId is required");
    return await idbqlState.prompts.delete(promptId);
  }
  /* Settings */
  static async getSettings() {
    return await idbqlState.settings.getAll();
  }
  static async insertSettings(settingsData: Partial<SettingsType>) {
    return await idbqlState.settings.put(settingsData as SettingsType);
  }
  static async updateSettings(id: number, settingsData: Partial<SettingsType>) {
    if (!id) throw new Error("id is required");
    return await idbqlState.settings.update(id, settingsData);
  }
  static async deleteSettings(id: number) {
    if (!id) throw new Error("id is required");
    return await idbqlState.settings.delete(id);
  }

  /* User */
  static async getUser(id: number) {
    if (!id) throw new Error("id is required");
    return idbqlState.user.where({ id: { eq: id } })[0];
  }

  static async getUsers() {
    return await idbqlState.user.getAll();
  }

  static async insertUser(userData: Partial<UserType>) {
    return await idbqlState.user.put(userData as UserType);
  }

  static async updateUser(id: number, userData: Partial<UserType>) {
    if (!id) throw new Error("id is required");
    return await idbqlState.user.update(id, userData);
  }

  static async deleteUser(id: number) {
    if (!id) throw new Error("id is required");
    return await idbqlState.user.delete(id);
  }
}
