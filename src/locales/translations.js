import de from './de';
import es from './es';
import fr from './fr';
import it from './it';

export default {
	en: {
		ui: {
			settings: 'settings',
			newChat: 'create new chat',
			myChats: 'my chats',
			userProfile: 'user profile',
			signOut: 'sign out',
			aiCautionMessage: 'the llama can have some hallucinations',
			messageRole_user: 'user',
			messageRole_assistant: 'assistant',
			searchChats: 'search chats',
			thisWeek: 'this week',
			lastWeek: 'last week',
			retryInSeconds: 'retry in {{seconds}} seconds',
			noChats: 'no chats',
			startondate: 'date',
			use_model: 'use model',
			promptCenter: 'prompt center'
		},
		settings: {
			auth: 'authentication',
			lang: 'language',
			avatar: 'avatar',
			avatar_email: 'email from gravatar',
			voice_auto_stop: 'auto stop voice',
			title_auto: 'auto title generation',
			test_connection: 'test connection',
			system_prompt: 'system prompt',
			server_url: 'Ollama server url',
			theme: 'theme',
			theme_light: 'light',
			theme_dark: 'dark',
			pull_model: 'enter a model name to pull',
			enter_model: 'enter a model name to pull',
			model_delete: 'delete model',
			default_model: 'enter default model',
			request_mode: 'plain',
			resetAll: 'reset all',
			delete_model: 'delete model',
			configureOllama: 'configure Ollama',
			resetOllamaOptions: 'reset Ollama options',
			delete_model_message: 'are you sure you want to delete this model?',
			modules: {
				infos: 'infos',
				addons: 'addons',
				models: 'models',
				advanced: 'advanced',
				general: 'general'
			}
		},
		status: {
			connecting: 'connecting',
			error: 'error',
			connected: 'connected'
		},
		prompt: {
			systemPrompt: 'system prompt',
			promptCenter: 'prompt center',
			createPrompt: 'create prompt'
		}
	},
	fr: fr.fr,
	de: de.de,
	es: es.es,
	it: it.it
};
