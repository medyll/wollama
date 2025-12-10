export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type MessageStatus = 'idle' | 'done' | 'sent' | 'streaming' | 'error';

export interface MessageImage {
	name: string;
	type: string;
	dataUri: string;
	base64: string;
}

export interface MessageUrl {
	url: string;
	image?: string;
	order: number;
	title?: string;
}

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

export interface Chat {
	chat_id: string; // UUID
	user_id: string; // UUID
	companion_id?: string; // UUID (Companion)

	title: string;
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

export interface ChatList {
	[key: string]: Chat;
}

export interface Companion {
	companion_id: string; // UUID
	name: string;
	description?: string;
	system_prompt: string;
	model: string; // Ollama model name
	
	// Audio
	voice_id?: string;
	voice_tone?: 'neutral' | 'fast' | 'slow' | 'deep' | 'high';
	mood?: 'neutral' | 'happy' | 'sad' | 'angry' | 'sarcastic' | 'professional' | 'friendly';
	
	// Metadata
	avatar?: string;
	created_at: number;
	updated_at?: number;
	
	// Legacy/Enhanced
	specialization?: 'character development' | 'plot outline' | 'world building' | 'dialogue' | 'general';
	is_locked?: boolean; // ia_lock
}

export interface UserCompanion extends Companion {
	user_id: string; // UUID
	original_companion_id?: string; // UUID (if forked from system companion)
}

export interface UserPreferences {
	theme: string;
	locale: string;
	auto_play_audio: boolean;
	server_url?: string;
}

export interface User {
	user_id: string; // UUID
	username: string;
	preferences: UserPreferences;
	created_at: number;
}
