import de from './de';
import es from './es';
import fr from './fr';

import it from './it';

export const translations = {
	de: de.de,
	en: {
		prompt:   {
			createPrompt: 'create prompt',
			promptCenter: 'prompt center',
			systemPrompt: 'system prompt'
		},
		settings: {
			subtitle:             'Customize your Wollama experience',
			nickname:             'Nickname / Identity',
			nickname_placeholder: 'How should I call you?',
			interface:            'Interface',
			ai:                   'Artificial Intelligence',
			model_placeholder:    'e.g. mistral:latest, llama3',
			model_help:           'The default Ollama model for new chats.',
			temperature:          'Temperature',
			precise:              'Precise',
			creative:             'Creative',
			server_connection:    'Server & Connection',
			server_host:          'Wollama Server Host',
			server_help:          'The address of your local or remote Node.js server.',
			save_continue:        'Save and Continue',
			auth:                 'authentication',
			avatar:               'avatar',
			avatar_email:         'email from gravatar',
			lang:                 'language',
			server_url:           'Ollama server url',
			system_prompt:        'system prompt',
			enter_model:          'enter a model name to pull',
			test_connection:      'test connection',
			default_model:        'enter default model',
			title_auto:           'auto title generation',
			model_delete:         'delete model',
			voice_auto_stop:      'auto stop voice',
			delete_model:         'delete model',
			theme:                'theme',
			configureOllama:      'configure Ollama',
			theme_dark:           'dark',
			delete_model_message: 'are you sure you want to delete this model?',
			theme_light:          'light',
			modules:              {
				addons:   'addons',
				advanced: 'advanced',
				general:  'general',
				infos:    'infos',
				models:   'models'
			},
			pull_model:           'enter a model name to pull',
			request_mode:         'plain',
			resetAll:             'reset all',
			resetOllamaOptions:   'reset Ollama options'
		},
		status:   {
			connected:  'connected',
			connecting: 'connecting',
			error:      'error',
			server_connected: 'Server connected',
			connection_restored: 'Connection restored',
			server_inaccessible: 'Server inaccessible',
			still_inaccessible: 'Still inaccessible',
			offline_mode: 'Offline mode activated',
			retry: 'Retry',
			continue_offline: 'Continue Offline',
			check_server: "Impossible to reach Wollama server. Check if it is running or update the address."
		},
		ui:       {
			loading_assistant:     'Loading your personal assistant...',
			ready_to_chat:         'Ready to chat?',
			select_chat_help:      'Select a conversation from the menu or start a new one.',
			general_assistant:     'General Assistant',
			welcome_message:       'Hello! How can I help you today?',
			interlocutor_changed:  'Interlocutor changed to:',
			chat_title:            'Chat',
			with:                  'With:',
			change:                'Change',
			you:                   'You',
			assistant:             'Assistant',
			type_message:          'Type your message...',
			general_assistant_desc: 'A versatile assistant for all your tasks.',
			expert_coder:          'Expert Coder',
			expert_coder_desc:     'Specialized in software development.',
			translator:            'Translator',
			translator_desc:       'Translates your texts into multiple languages.',
			choose_companion:      'Choose a Companion',
			signIn:                'Sign In / Sync',
			aiCautionMessage:      'the llama can have some hallucinations',
			myChats:               'my chats',
			messageRole_assistant: 'assistant',
			newChat:               'create new chat',
			lastWeek:              'last week',
			settings:              'settings',
			messageRole_user:      'user',
			signOut:               'sign out',
			noChats:               'no chats',
			userProfile:           'user profile',
			promptCenter:          'prompt center',
			retryInSeconds:        'retry in {{seconds}} seconds',
			searchChats:           'search chats',
			startondate:           'date',
			thisWeek:              'this week',
			use_model:             'use model',
			file_too_large:        'File {{name}} is too large (max 2MB)'
		},
		chat:     {
			categorize:       'categorize',
			delete_chat:      'delete',
			guess_chat_title: 'guess title',
			describe:         'describe'
		},
		setup: {
			subtitle: 'Choose how you want to start your journey.'
		}
	},
	es: es.es,
	fr: fr.fr,
	it: it.it
};
