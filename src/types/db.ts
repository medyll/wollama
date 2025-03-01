import type { TplFieldType } from "@medyll/idae-idbql";
import type { OllamaChat } from "./ollama";

/**
 * Represents a chat.
 */
export type DbChat = {
  id: number;
  chatId: string;
  chatPassKey: string;
  categoryId: number;
  title: string;
  description: string;
  models: string[];
  created_at: Date;
  category: string;
  dateLastMessage: Date;
  tags: DbTags[];
  systemPrompt: PromptType;
  context: number[];
  ollamaBody: Partial<OllamaChat>;
  // Ajout suggéré
  bookId?: number;
};
export type DbCategory = {
  id: number;
  name: string;
  code: string;
  ia_lock: boolean;
};
export type DbTags = {
  id: number;
  name: string;
  code: string;
  ia_lock: boolean;
};

/**
 * Represents a chat list type.
 */
export interface ChatListType {
  [key: string]: DbChat;
}

/**
 * Represents a message.
 */
export type DBMessage = {
  id: number;
  messageId?: string;
  chatId: string;
  content: string;
  created_at: Date;
  images?: MessageImageType;
  status: "idle" | "done" | "sent" | "streaming" | "error";
  context: number[];
  resume: string;
  model: string;
  ia_lock: boolean;
  urls?: { url: string; image?: string; order: number; title?: string }[];
} & (
  | {
      role: "system";
    }
  | {
      role: "user";
    }
  | {
      role: "assistant";
      model?: string;
    }
);

export type DbPrimitive =
  | "date"
  | "text"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | `${string}.${string}`;
export type DbFieldTypes =
  | DbPrimitive
  | `array-of-${DbPrimitive}`
  | `object-${DbPrimitive}`
  | `fk-${DbPrimitive}`;

export type DbTemplateModel<TPL> = {
  [COL in keyof TPL]: {
    fields: {
      [T in keyof TPL[COL]]: TPL[COL][T]; //extends { model: infer M } ? DbTemplate<M> : never;
    };
  };
};

export type DbTemplate<T> = {
  fields: {
    [K in keyof T]: TplFieldType;
  };
};
export type DBAgent = {
  id: number;
  name: string;
  code: string;
  model: string;
  prompt: string;
  agentPromptId: number;
  ia_lock: boolean;
  created_at: Date;
  //
  specialization?:
    | "character development"
    | "plot outline"
    | "world building"
    | "dialogue"
    | "general";
};

export type DbAgentPrompt = {
  id: number;
  created_at: Date;
  value: string;
  name: string;
  code: string;
  ia_lock: boolean;
}; //

export type DbAgentOf = {
  id: number;
  created_at: Date;
  value: string;
  name: string;
  code: string;
  collection: string;
  collectionId: number;
  ia_lock: boolean;
}; //
export type DbMessageListType = {
  [key: string]: DBMessage;
};

export type MessageImageType = {
  name: string;
  type: string;
  dataUri: string;
  header: string;
  base64: string;
};

export type PromptType = {
  id: string;
  createdAt: Date;
  value: string;
  title: string;
  code: string;
  ia_lock: boolean;
};

// BOOKER
// Nouvelles interfaces pour le Book Creator Helper

export interface DbBook {
  id?: number;
  userId: number;
  title: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  status: "draft" | "in_progress" | "completed" | "published";
  ia_lock: boolean;
}

export interface DbChapter {
  id?: number;
  bookId: number;
  title: string;
  content: string;
  order: number;
  created_at: Date;
  updated_at: Date;
  ia_lock: boolean;
}

export interface DbWritingGoal {
  id?: number;
  userId: number;
  bookId: number;
  description: string;
  targetWordCount: number;
  deadline: Date;
  created_at: Date;
  updated_at: Date;
  ia_lock: boolean;
}

export interface DbCharacter {
  id?: number;
  bookId: number;
  characterLinkId: number[];
  firstName: string;
  lastName: string;
  nickname?: string;
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  description: string;
  backstory?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  physicalDescription?: string;
  personalityTraits: string[];
  goals?: string;
  conflicts?: string;
  created_at: Date;
  updated_at: Date;
  ia_lock: boolean;
}

export interface DbCharacterChapterStatus {
  id?: number;
  characterId: number;
  chapterId: number;
  status: "present" | "mentioned" | "absent";
  role: "major" | "minor" | "background";
  actions: string;
  development: string;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbBookPrompts {
  id?: number;
  bookId: number;
  name: string;
  category: "character" | "plot" | "setting" | "dialogue" | "general";
  content: string;
  created_at: Date;
  updated_at: Date;
  ia_lock: boolean;
}

export interface DbCharacterLink {
  id: string;
  characterId: number[];
  type: string;
  description: string;
  active: boolean;
}

export interface DbSpaces {
  id: number;
  code: string;
  name: string;
  promptTypeId: number[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
