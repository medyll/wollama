/** Who authored a message, using the same vocabulary as the Ollama chat API. */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** Delivery state of a message, driving the spinners and retry affordances in the UI. */
export type MessageStatus = 'idle' | 'done' | 'sent' | 'streaming' | 'error';

/** An image attached to a message, carried both as a data URI (for display) and as raw base64 (for the model). */
export interface MessageImage {
	name: string;
	type: string;
	dataUri: string;
	base64: string;
}

/** A link extracted from or attached to a message, with the preview metadata fetched for it. */
export interface MessageUrl {
	url: string;
	image?: string;
	order: number;
	title?: string;
}

/** A single chat message. */
export interface Message {
	message_id: string; // UUID
	chat_id: string; // UUID
	role: MessageRole;
	content: string;
	created_at: number; // Timestamp

	// Enhanced fields from legacy db.ts
	status?: MessageStatus;
	context?: number[]; // Ollama context
	model?: string;
	images?: MessageImage[];
	urls?: MessageUrl[];
	audio_file_path?: string;

	// Legacy fields support if needed
	resume?: string;
}

/** A conversation: its metadata, and optionally the messages themselves. */
export interface Chat {
	chat_id: string; // UUID
	user_id: string; // UUID
	companion_id?: string; // UUID (Companion)

	title: string;
	description?: string;
	created_at: number; // Timestamp
	updated_at: number; // Timestamp

	// Enhanced fields
	tags?: string[];
	category?: string;
	system_prompt?: string;
	context?: number[]; // Last context
	model?: string; // Current model used in this chat

	// Navigation/UI
	messages?: Message[]; // Optional, for loading full chat
}

/** Chats indexed by `chat_id`. */
export interface ChatList {
	[key: string]: Chat;
}

/** A configured assistant persona: model, system prompt, voice and mood. */
export interface Companion {
	companion_id: string; // UUID
	name: string;
	description?: string;
	system_prompt: string;
	model: string; // Ollama model name

	// Audio
	voice_id?: string;
	voice_tone?: 'neutral' | 'fast' | 'slow' | 'deep' | 'high';
	mood?: 'neutral' | 'happy' | 'sad' | 'angry' | 'sarcastic' | 'professional' | 'friendly' | 'sexy';

	// Metadata
	avatar?: string;
	created_at: number;
	updated_at?: number;

	// Legacy/Enhanced
	specialization?:
		| 'character development'
		| 'plot outline'
		| 'world building'
		| 'dialogue'
		| 'general'
		| 'coding'
		| 'prompt-engineering'
		| 'roleplay'
		| 'storytelling';
	is_locked?: boolean; // ia_lock
}

/** A companion owned by a user — either created outright, or forked from a system companion (`companion_id`). */
export interface UserCompanion extends Omit<Companion, 'companion_id'> {
	user_companion_id: string; // UUID
	user_id: string; // UUID
	companion_id?: string; // UUID (if forked from system companion)
}

/** Per-user settings. */
export interface UserPreferences {
	theme: string;
	locale: string;
	auto_play_audio: boolean;
	server_url?: string;
}

/** An account on this Wollama instance. */
export interface User {
	user_id: string; // UUID
	username: string;
	preferences: UserPreferences;
	created_at: number;
}

/** A free-form label that can be attached to chats. */
export interface Tag {
	tag_id: string; // UUID
	name: string;
	created_at: number;
	updated_at?: number;
}
