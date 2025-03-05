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
			error:      'error'
		},
		ui:       {
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
			use_model:             'use model'
		},
		chat:     {
			categorize:       'categorize',
			delete_chat:      'delete',
			guess_chat_title: 'guess title',
			describe:         'describe'
		}
	},
	es: es.es,
	fr: fr.fr,
	it: it.it
};
