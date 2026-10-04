export default {
	es: {
		prompt: {
			promptCenter: 'centro del prompt'
		},
		settings: {
			provider: 'Proveedor de IA',
			provider_primary: 'Principal',
			provider_unavailable: 'No disponible',
			providers_help:
				'Ollama ejecuta modelos locales. Codex, Claude y Kimi usan la CLI instalada y autenticada en el servidor y pueden necesitar Internet. La disponibilidad confirma la instalación, no la autenticación.',
			providers_refresh: 'Actualizar proveedores',
			providers_error: 'No se pudieron cargar los proveedores.',
			provider_model: 'Modelo de la CLI',
			provider_model_help:
				'Use default para el modelo predeterminado de la CLI o indique un modelo disponible en su cuenta.',
			groups: {
				personal: 'Personal',
				assistant: 'Asistente',
				advanced: 'Avanzado'
			},
			auth: 'autenticación',
			avatar: 'avatar',
			avatar_email: 'email de gravatar',
			lang: 'idioma',
			server_url: 'URL del servidor Ollama',
			enter_model: 'introducir un nombre de modelo para descargar',
			system_prompt: 'prompt del sistema',
			delete_model: 'eliminar modelo',
			test_connection: 'probar conexión',
			default_model: 'introducir modelo por defecto',
			title_auto: 'generación automática de título',
			model_delete: 'eliminar modelo',
			voice_auto_stop: 'parada automática de voz',
			modules: {
				addons: 'complementos',
				advanced: 'avanzado',
				general: 'general',
				infos: 'información',
				models: 'modelos'
			},
			theme: 'tema',
			pull_model: 'introducir un nombre de modelo para descargar',
			theme_dark: 'oscuro',
			request_mode: 'simple',
			theme_light: 'claro',
			resetAll: 'restablecer todo'
		},
		status: {
			connected: 'conectado',
			connecting: 'conectando',
			error: 'error'
		},
		ui: {
			aiCautionMessage: 'la llama puede tener algunas alucinaciones',
			messageRole_assistant: 'asistente',
			myChats: 'mis chats',
			lastWeek: 'la semana pasada',
			newChat: 'crear nuevo chat',
			messageRole_user: 'usuario',
			settings: 'ajustes',
			noChats: 'sin chats',
			signOut: 'cerrar sesión',
			retryInSeconds: 'reintentar en {{seconds}} segundos',
			userProfile: 'perfil de usuario',
			searchChats: 'buscar chats',
			startondate: 'fecha de inicio',
			thisWeek: 'esta semana',
			use_model: 'usar modelo'
		}
	}
};
