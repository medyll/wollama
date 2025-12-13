import path from 'path';

export const config = {
	server: {
		port: Number(process.env.PORT) || 3000,
		host: process.env.HOST || '0.0.0.0'
	},
	database: {
		// Directory where PouchDB stores data (LevelDB files)
		// Defaults to 'data' folder in the project root
		dir: process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.resolve(process.cwd(), 'db_data')
	},
	pouchdb: {
		// Configuration for express-pouchdb
		inMemoryConfig: true,
		mode: 'minimumForPouchDB' as const, // 'full' | 'minimumForPouchDB' | 'custom'
		// Path for logs if we wanted to enable file logging (optional)
		logPath: path.resolve(process.cwd(), 'logs')
	},
	cors: {
		origin: process.env.CORS_ORIGIN || '*'
	},
	ollama: {
		host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
		defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'mistral:latest'
	},
	stt: {
		url: process.env.STT_URL || 'http://127.0.0.1:9000/v1/audio/transcriptions',
		enabled: process.env.STT_ENABLED === 'true' || true, // Default to true to try local
		provider: process.env.STT_PROVIDER || 'local', // 'openai' | 'local'
		binaryPath:
			process.env.STT_BINARY_PATH ||
			path.resolve(process.cwd(), 'bin', 'whisper', process.platform === 'win32' ? 'main.exe' : 'main'),
		modelPath: process.env.STT_MODEL_PATH || path.resolve(process.cwd(), 'bin', 'whisper', 'ggml-base.bin')
	},
	tts: {
		url: process.env.TTS_URL || 'http://127.0.0.1:9000/v1/audio/speech',
		enabled: process.env.TTS_ENABLED !== 'false',
		provider: process.env.TTS_PROVIDER || 'local', // 'openai' | 'local'
		binaryPath:
			process.env.TTS_BINARY_PATH ||
			path.resolve(process.cwd(), 'bin', 'piper', process.platform === 'win32' ? 'piper.exe' : 'piper'),
		modelDir: path.resolve(process.cwd(), 'bin', 'piper'),
		defaultVoice: 'en_US-lessac-medium.onnx'
	}
};
