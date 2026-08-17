import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface McpHttpServerConfig {
	id: string;
	url: string;
	/** Only set true for a local dev server the operator deliberately configured —
	 *  never settable from a tool, model, or client request. */
	allowPrivateHost?: boolean;
	/** Name of the env var holding the bearer token — the token itself never lives in
	 *  this config object, only the var name that resolves it at connection time. */
	tokenEnvVar?: string;
}

function parseHttpServers(json: string | undefined): McpHttpServerConfig[] {
	if (!json) return [];
	try {
		const parsed = JSON.parse(json);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((s): s is McpHttpServerConfig => s && typeof s.id === 'string' && typeof s.url === 'string');
	} catch {
		return [];
	}
}

export const config = {
	server: {
		port: Number(process.env.PORT) || 3000,
		host: process.env.HOST || '0.0.0.0'
	},
	database: {
		// Directory where PouchDB stores data (LevelDB files)
		// Defaults to 'data' folder in the project root
		dir: process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.resolve(__dirname, 'db_data')
	},
	pouchdb: {
		// Configuration for express-pouchdb
		inMemoryConfig: true,
		mode: 'minimumForPouchDB' as const, // 'full' | 'minimumForPouchDB' | 'custom'
		// Path for logs if we wanted to enable file logging (optional)
		logPath: path.resolve(__dirname, 'logs')
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
		enabled: process.env.STT_ENABLED !== 'false',
		provider: process.env.STT_PROVIDER || 'local', // 'openai' | 'local'
		binaryPath:
			process.env.STT_BINARY_PATH ||
			path.resolve(__dirname, 'bin', 'whisper', process.platform === 'win32' ? 'main.exe' : 'main'),
		modelPath: process.env.STT_MODEL_PATH || path.resolve(__dirname, 'bin', 'whisper', 'ggml-base.bin')
	},
	rag: {
		embedModel: process.env.RAG_EMBED_MODEL || 'nomic-embed-text',
		chunkSize: Number(process.env.RAG_CHUNK_SIZE) || 500,
		chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP) || 50,
		topK: Number(process.env.RAG_TOP_K) || 5,
		minScore: Number(process.env.RAG_MIN_SCORE) || 0.5,
		// Directory where per-user flat vector index files are persisted
		vectorDir: process.env.RAG_VECTOR_DIR
			? path.resolve(process.env.RAG_VECTOR_DIR)
			: path.resolve(__dirname, 'db_data', 'vectors')
	},
	tts: {
		url: process.env.TTS_URL || 'http://127.0.0.1:9000/v1/audio/speech',
		enabled: process.env.TTS_ENABLED !== 'false',
		provider: process.env.TTS_PROVIDER || 'local', // 'openai' | 'local'
		binaryPath:
			process.env.TTS_BINARY_PATH ||
			path.resolve(__dirname, 'bin', 'piper', process.platform === 'win32' ? 'piper.exe' : 'piper'),
		modelDir: process.env.TTS_MODEL_DIR || path.resolve(__dirname, 'bin', 'piper'),
		defaultVoice: 'en_US-lessac-medium.onnx'
	},
	tools: {
		enabled: process.env.WOLLAMA_TOOLS === '1',
		maxIterations: Number(process.env.WOLLAMA_TOOL_MAX_ITERATIONS) || 4,
		autoApprove: (process.env.WOLLAMA_TOOL_AUTOAPPROVE ?? 'builtin:web-search,builtin:page-fetch')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	},
	mcp: {
		acpTeam: {
			enabled: process.env.ACP_TEAM_ENABLED === '1',
			// absolute path to acp-team's src/mcp-server.js
			entry: process.env.ACP_TEAM_ENTRY || '',
			dataDir: process.env.ACP_TEAM_DATA_DIR || ''
		},
		workspaceAllowlist: (process.env.WOLLAMA_WORKSPACES ?? '').split(path.delimiter).filter(Boolean),
		// Streamable HTTP MCP servers (M7). Credentials are env-var references only —
		// see McpHttpServerConfig.tokenEnvVar. Format:
		//   WOLLAMA_MCP_HTTP_SERVERS='[{"id":"example","url":"https://mcp.example.com","tokenEnvVar":"EXAMPLE_MCP_TOKEN"}]'
		servers: parseHttpServers(process.env.WOLLAMA_MCP_HTTP_SERVERS)
	}
};
