import type { DatabaseSchema } from './schema-definition.js';

// don't forget to update the version number in the file client\src\lib\db.ts when changing the schema
export const appSchema: DatabaseSchema = {
	users: {
		primaryKey: 'user_id',
		indexes: ['username'],
		template: {
			presentation: 'username',
			card_lines: ['username', 'created_at']
		},
		fields: {
			user_id: { type: 'uuid', required: true },
			username: { type: 'string', required: true },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true }
		}
	},
	user_preferences: {
		primaryKey: 'user_preferences_id',
		fk: {
			user_id: { table: 'users', required: true, multiple: false }
		},
		fields: {
			user_preferences_id: { type: 'uuid', required: true },
			user_id: { type: 'uuid', required: true },
			theme: { type: 'string', ui: { type: 'select', options: ['light', 'dark', 'system'] } },
			locale: { type: 'string', ui: { type: 'select', options: ['en', 'fr', 'es', 'de'] } },
			auto_play_audio: { type: 'boolean', ui: { type: 'toggle' } },
			server_url: { type: 'string', ui: { type: 'url' } },
			default_model: { type: 'string' },
			default_temperature: { type: 'number', ui: { type: 'slider', min: 0, max: 1, step: 0.1 } },
			onboarding_completed: { type: 'boolean', ui: { type: 'toggle' }, default: false },
			updated_at: { type: 'timestamp', auto: true }
		}
	},
	companions: {
		primaryKey: 'companion_id',
		indexes: ['name'],
		template: {
			presentation: 'name',
			card_lines: ['description', 'model', 'specialization']
		},
		fields: {
			companion_id: { type: 'uuid', required: true },
			name: { type: 'string', required: true },
			description: { type: 'string', ui: { type: 'textarea' } },
			system_prompt: { type: 'text-long', required: true, ui: { type: 'textarea', rows: 10 } },
			model: { type: 'string', required: true },
			voice_id: { type: 'string' },
			voice_tone: { type: 'string', enum: ['neutral', 'fast', 'slow', 'deep', 'high'] },
			mood: { type: 'string', enum: ['neutral', 'happy', 'sad', 'angry', 'sarcastic', 'professional', 'friendly', 'sexy'] },
			avatar: { type: 'string', ui: { type: 'image' } },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true },
			specialization: { type: 'string' },
			is_locked: { type: 'boolean' },
			// Skills / Hooks bindings
			hooks: { type: 'array', items: { type: 'string' } },
			skills: { type: 'array', items: { type: 'string' } }
		}
	},
	user_companions: {
		primaryKey: 'user_companion_id',
		indexes: ['name', 'user_id'],
		template: {
			presentation: 'name',
			card_lines: ['description', 'model', 'specialization']
		},
		fk: {
			user_id: { table: 'users', required: true, multiple: true },
			companion_id: { table: 'companions', required: false, multiple: true }
		},
		fields: {
			user_companion_id: { type: 'uuid', required: true },
			user_id: { type: 'uuid', required: true },
			companion_id: { type: 'uuid' },
			name: { type: 'string', required: true },
			description: { type: 'string', ui: { type: 'textarea' } },
			system_prompt: { type: 'text-long', required: true, ui: { type: 'textarea', rows: 10 } },
			model: { type: 'string', required: true },
			voice_id: { type: 'string' },
			voice_tone: { type: 'string', enum: ['neutral', 'fast', 'slow', 'deep', 'high'] },
			mood: { type: 'string', enum: ['neutral', 'happy', 'sad', 'angry', 'sarcastic', 'professional', 'friendly', 'sexy'] },
			avatar: { type: 'string', ui: { type: 'image' } },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true },
			specialization: { type: 'string' },
			is_locked: { type: 'boolean' }
		}
	},
	chats: {
		primaryKey: 'chat_id',
		indexes: ['user_id', 'companion_id', 'updated_at'],
		template: {
			presentation: 'title',
			card_lines: ['title', 'model', 'companion_id.name']
		},
		fk: {
			user_id: { table: 'users', required: true, multiple: true },
			companion_id: { table: 'companions', required: false, multiple: true }
		},
		fields: {
			chat_id: { type: 'uuid', required: true },
			user_id: { type: 'uuid', required: true },
			companion_id: { type: 'uuid' },
			title: { type: 'string', required: true },
			description: { type: 'string' },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', required: true, auto: true },
			tags: { type: 'array', items: { type: 'string' } },
			category: { type: 'string' },
			system_prompt: { type: 'text-long' },
			context: { type: 'array', items: { type: 'number' } },
			model: { type: 'string' }
		}
	},
	messages: {
		primaryKey: 'message_id',
		indexes: ['chat_id', 'created_at'],
		template: {
			presentation: 'content',
			card_lines: ['role', 'content', 'model']
		},
		fk: {
			chat_id: { table: 'chats', required: true, multiple: true }
		},
		fields: {
			message_id: { type: 'uuid', required: true },
			chat_id: { type: 'uuid', required: true },
			role: { type: 'string', required: true, enum: ['system', 'user', 'assistant', 'tool'] },
			content: { type: 'text-long', required: true },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true },
			status: { type: 'string', enum: ['idle', 'done', 'sent', 'streaming', 'error'] },
			context: { type: 'array', items: { type: 'number' } },
			model: { type: 'string' },
			audio_file_path: { type: 'string' },
			images: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						type: { type: 'string' },
						dataUri: { type: 'string' },
						base64: { type: 'string' }
					}
				}
			},
			urls: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						url: { type: 'string' },
						image: { type: 'string' },
						order: { type: 'number' },
						title: { type: 'string' }
					}
				}
			},
			// Skills / Hooks extensions
			tool_call_id: { type: 'uuid' },
			skill_invoked: { type: 'string' }, // e.g. "/translate fr"
			hook_log: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						hook_id: { type: 'string' },
						event: { type: 'string' },
						duration_ms: { type: 'number' },
						mutated: { type: 'boolean' },
						error: { type: 'string' }
					}
				}
			}
		}
	},
	user_prompts: {
		primaryKey: 'prompt_id',
		indexes: ['is_active'],
		template: {
			presentation: 'content',
			card_lines: ['content', 'is_active']
		},
		fields: {
			prompt_id: { type: 'uuid', required: true },
			content: {
				type: 'text-long',
				required: true,
				ui: { type: 'textarea', rows: 3, label: 'Prompt / Phrase' },
				ai: {
					trigger: 'auto_pre',
					systemPrompt: `You are an expert prompt engineer. Your task is to rewrite the user's instruction to be a clear, concise, and effective system prompt for an LLM. It should define a user preference or behavior.
IMPORTANT:
1. Output ONLY the raw rewritten prompt.
2. Do NOT include any prefixes, labels, titles, or explanations.
3. Do not use any quotation marks or formatting.
4. Write in the THIRD PERSON, referring to "the user" (or "l'utilisateur", "el usuario", etc. depending on the language).
5. The rewritten prompt MUST be in the language corresponding to the locale '{{locale}}'.`
				}
			},
			is_active: { type: 'boolean', ui: { type: 'toggle', label: 'Active' }, default: true },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true }
		}
	},
	languages: {
		primaryKey: 'code',
		indexes: ['name'],
		template: {
			presentation: 'name',
			card_lines: ['name', 'flag']
		},
		fields: {
			code: { type: 'string', required: true }, // 'en', 'fr', etc.
			name: { type: 'string', required: true },
			flag: { type: 'string', required: true }, // Emoji or image path
			created_at: { type: 'timestamp', auto: true },
			updated_at: { type: 'timestamp', auto: true }
		}
	},
	tags: {
		primaryKey: 'tag_id',
		indexes: ['name'],
		template: {
			presentation: 'name',
			card_lines: ['name']
		},
		fields: {
			tag_id: { type: 'uuid', required: true },
			name: { type: 'string', required: true },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true }
		}
	},

	// ── Agents / Skills / Hooks ──────────────────────────────────────────────

	skills: {
		primaryKey: 'skill_id',
		indexes: ['name', 'scope', 'is_enabled'],
		template: {
			presentation: 'display_name',
			card_lines: ['description', 'command', 'handler_type']
		},
		fields: {
			skill_id: { type: 'uuid', required: true },
			name: { type: 'string', required: true }, // slug: "translate"
			display_name: { type: 'string', required: true },
			description: { type: 'string', ui: { type: 'textarea' } },
			command: { type: 'string', required: true }, // "/translate"
			icon: { type: 'string' },
			input_schema: {
				type: 'object',
				properties: {}
			},
			handler_type: {
				type: 'string',
				required: true,
				enum: ['builtin', 'llm', 'agent']
			},
			handler_ref: { type: 'string', required: true }, // fn name or agent_id
			scope: {
				type: 'string',
				required: true,
				enum: ['global', 'user', 'companion'],
				default: 'global'
			},
			is_enabled: { type: 'boolean', default: true },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true }
		}
	},

	agents: {
		primaryKey: 'agent_id',
		indexes: ['name', 'type', 'is_enabled'],
		template: {
			presentation: 'name',
			card_lines: ['description', 'type']
		},
		fields: {
			agent_id: { type: 'uuid', required: true },
			name: { type: 'string', required: true },
			description: { type: 'string', ui: { type: 'textarea' } },
			type: {
				type: 'string',
				required: true,
				enum: ['web_search', 'page_fetch', 'file_reader', 'custom']
			},
			config: { type: 'object', properties: {} }, // type-specific config
			is_enabled: { type: 'boolean', default: true },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true }
		}
	},

	hooks: {
		primaryKey: 'hook_id',
		indexes: ['event', 'scope', 'is_enabled', 'priority'],
		template: {
			presentation: 'name',
			card_lines: ['event', 'handler_type', 'priority']
		},
		fields: {
			hook_id: { type: 'uuid', required: true },
			name: { type: 'string', required: true },
			event: {
				type: 'string',
				required: true,
				enum: ['pre-send', 'post-receive', 'on-session-start', 'on-session-end', 'on-tool-result']
			},
			handler_type: {
				type: 'string',
				required: true,
				enum: ['builtin', 'llm', 'skill']
			},
			handler_ref: { type: 'string', required: true },
			priority: { type: 'number', default: 100 }, // lower = runs first
			scope: {
				type: 'string',
				required: true,
				enum: ['global', 'user', 'companion'],
				default: 'global'
			},
			scope_id: { type: 'uuid' }, // user_id or companion_id if scoped
			is_enabled: { type: 'boolean', default: true },
			config: { type: 'object', properties: {} },
			created_at: { type: 'timestamp', required: true, auto: true },
			updated_at: { type: 'timestamp', auto: true }
		}
	},

	tool_calls: {
		primaryKey: 'tool_call_id',
		indexes: ['message_id', 'agent_id', 'status', 'started_at'],
		fk: {
			message_id: { table: 'messages', required: true, multiple: false },
			agent_id: { table: 'agents', required: true, multiple: false }
		},
		template: {
			presentation: 'tool_call_id',
			card_lines: ['status', 'started_at', 'finished_at']
		},
		fields: {
			tool_call_id: { type: 'uuid', required: true },
			message_id: { type: 'uuid', required: true },
			agent_id: { type: 'uuid', required: true },
			skill_id: { type: 'uuid' }, // nullable — set when triggered by a skill
			status: {
				type: 'string',
				required: true,
				enum: ['pending', 'running', 'done', 'error'],
				default: 'pending'
			},
			input: { type: 'object', properties: {} },
			output: { type: 'object', properties: {} },
			error: { type: 'string' },
			started_at: { type: 'timestamp', required: true, auto: true },
			finished_at: { type: 'timestamp' }
		}
	}
};
