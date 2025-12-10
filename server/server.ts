import express from 'express';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import expressPouchDB from 'express-pouchdb';
import multer from 'multer';
import { dbManager } from './db/database.js';
import { config } from './config.js';
import { SttService } from './services/stt.service.js';
import { TtsService } from './services/tts.service.js';
import { OllamaService } from './services/ollama.service.js';
import { PromptService } from './services/prompt.service.js';
import { logger } from './utils/logger.js';

import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.server.port;

// Multer setup for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// CORS Configuration
app.use(cors({
    origin: config.cors.origin,
    credentials: true
}));

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mount PouchDB Server
// This exposes the databases at /_db/{dbname}
// It uses the same PouchDB constructor as our internal services
// Note: Must be mounted BEFORE express.json() because PouchDB needs the raw stream
app.use('/_db', expressPouchDB(dbManager.getPouchDBConstructor(), {
    inMemoryConfig: config.pouchdb.inMemoryConfig,
    mode: config.pouchdb.mode
}));

app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Audio Routes
app.post('/api/audio/transcribe', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const text = await SttService.transcribe(req.file.buffer, req.file.originalname);
        res.json({ text });
    } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: 'Transcription failed' });
    }
});

app.post('/api/audio/speak', async (req, res) => {
    try {
        const { text, voiceId, voiceTone } = req.body;
        if (!text) {
            res.status(400).json({ error: 'Text is required' });
            return;
        }
        const audioBuffer = await TtsService.speak(text, voiceId, voiceTone);
        if (!audioBuffer) {
            res.status(500).json({ error: 'TTS failed or disabled' });
            return;
        }
        res.set('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(audioBuffer));
    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: 'TTS failed' });
    }
});

app.post('/api/chat/generate', async (req, res) => {
    try {
        const { model, messages, stream, context } = req.body;

        // Process Context if available
        if (context) {
            // 1. Update System Prompt
            const systemMsgIndex = messages.findIndex((m: any) => m.role === 'system');
            let baseSystemPrompt = '';
            if (systemMsgIndex !== -1) {
                baseSystemPrompt = messages[systemMsgIndex].content;
            }
            
            // Fetch active user prompts
            const promptsDb = dbManager.getDb('user_prompts');
            const activePromptsResult = await promptsDb.find({
                selector: { is_active: true }
            });
            const activePrompts = activePromptsResult.docs || [];

            const newSystemPrompt = PromptService.buildSystemPrompt(baseSystemPrompt, context.profile, activePrompts);
            
            if (systemMsgIndex !== -1) {
                messages[systemMsgIndex].content = newSystemPrompt;
            } else {
                messages.unshift({ role: 'system', content: newSystemPrompt });
            }

            // 2. Enrich Last User Message
            let lastUserMsgIndex = -1;
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === 'user') {
                    lastUserMsgIndex = i;
                    break;
                }
            }

            if (lastUserMsgIndex !== -1) {
                messages[lastUserMsgIndex].content = PromptService.enrichUserMessage(
                    messages[lastUserMsgIndex].content, 
                    context.files
                );
            }
        }
        
        if (stream) {
            // Don't set headers immediately, wait until we have the stream or at least know the request is valid
            // However, for SSE/NDJSON we usually set them first. 
            // If OllamaService.chat throws, we can still send a JSON error if we haven't written data.
            
            try {
                const response = await OllamaService.chat({
                    model,
                    messages,
                    stream: true
                });

                // Only set headers if we successfully got a response stream
                res.setHeader('Content-Type', 'application/x-ndjson');
                res.setHeader('Transfer-Encoding', 'chunked');

                for await (const part of response) {
                    res.write(JSON.stringify(part) + '\n');
                }
                res.end();
            } catch (error: any) {
                // If headers are not sent, we can send a proper JSON error
                if (!res.headersSent) {
                    if (error.status_code === 404) {
                        res.status(404).json({ 
                            error: {
                                code: 'MODEL_NOT_FOUND',
                                message: error.error || `Model '${model}' not found`,
                            }
                        });
                    } else {
                        throw error; // Re-throw to outer catch
                    }
                } else {
                    // If headers were sent (unlikely here but possible), we write an error chunk
                    res.write(JSON.stringify({ error: error.message || 'Stream error' }) + '\n');
                    res.end();
                }
            }
        } else {
            const response = await OllamaService.chat({
                model,
                messages,
                stream: false
            });
            res.json(response);
        }
    } catch (error: any) {
        console.error('Chat generation error:', error);
        
        if (!res.headersSent) {
            const status = error.status_code || 500;
            const message = error.error || error.message || 'Chat generation failed';
            const code = error.status_code === 404 ? 'MODEL_NOT_FOUND' : 'INTERNAL_SERVER_ERROR';

            res.status(status).json({ 
                error: {
                    code,
                    message
                }
            });
        }
    }
});

// Model Management Routes
app.get('/api/models', async (req, res) => {
    try {
        const list = await OllamaService.list();
        res.json(list);
    } catch (error) {
        console.error('Error listing models:', error);
        res.status(500).json({ error: 'Failed to list models' });
    }
});

app.post('/api/models/pull', async (req, res) => {
    try {
        const { model } = req.body;
        if (!model) {
            res.status(400).json({ error: 'Model name is required' });
            return;
        }

        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Transfer-Encoding', 'chunked');

        const stream = await OllamaService.pull({ model, stream: true });

        for await (const part of stream) {
            res.write(JSON.stringify(part) + '\n');
        }
        res.end();

    } catch (error) {
        console.error('Error pulling model:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to pull model' });
        } else {
            res.end();
        }
    }
});

// Serve static files from the client build directory (if needed for standalone server)
// app.use(express.static(path.join(__dirname, '../client/build')));

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const isLocalHost = (host: string) => {
    return host.includes('localhost') || host.includes('127.0.0.1') || host.includes('0.0.0.0');
};

const isOllamaRunning = async () => {
    try {
        if (process.platform === 'win32') {
            const { stdout } = await execAsync('tasklist');
            const lowerOutput = stdout.toLowerCase();
            return lowerOutput.includes('ollama app.exe') || lowerOutput.includes('ollama.exe');
        } else {
            const { stdout } = await execAsync('pgrep -f ollama');
            return !!stdout.trim();
        }
    } catch {
        return false;
    }
};

const startLocalOllama = async () => {
    if (await isOllamaRunning()) {
        logger.info('OLLAMA', 'Local Ollama process detected running.');
        return true;
    }
    
    try {
        logger.info('OLLAMA', 'Attempting to find and start local Ollama instance...');
        
        if (process.platform === 'win32') {
            // Try to find ollama executable path
            const { stdout: whereOutput } = await execAsync('where ollama');
            const ollamaPath = whereOutput.split('\n')[0].trim();
            
            if (ollamaPath) {
                // Usually "ollama app.exe" is in the same folder or similar
                const appPath = path.join(path.dirname(ollamaPath), 'ollama app.exe');
                
                logger.info('OLLAMA', `Found Ollama at: ${appPath}`);
                
                // Start the process detached
                const child = spawn(appPath, [], {
                    detached: true,
                    stdio: 'ignore'
                });
                child.unref();
                
                logger.success('OLLAMA', 'Started local Ollama instance (Windows)');
                return true;
            }
        } else if (process.platform === 'darwin') {
            await execAsync('open -a Ollama');
            logger.success('OLLAMA', 'Started local Ollama instance (macOS)');
            return true;
        } else if (process.platform === 'linux') {
            const child = spawn('ollama', ['serve'], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
            logger.success('OLLAMA', 'Started local Ollama instance (Linux)');
            return true;
        }
    } catch (e) {
        logger.warn('OLLAMA', 'Could not auto-start local Ollama');
    }
    return false;
};

const initializeOllama = async () => {
    const defaultModel = config.ollama.defaultModel;
    const maxRetries = 5;
    const retryDelay = 3000;

    logger.info('OLLAMA', `Checking connection to ${config.ollama.host}...`);

    for (let i = 0; i < maxRetries; i++) {
        try {
            // 1. Check connection by listing models
            const list = await OllamaService.list();
            logger.success('OLLAMA', 'Connection established');

            // 2. Check if default model exists
            logger.info('OLLAMA', `Checking for default model '${defaultModel}'...`);
            const modelExists = list.models.some(m => m.name === defaultModel);

            if (!modelExists) {
                logger.warn('OLLAMA', `Model '${defaultModel}' not found. Starting download...`);
                // Stream the pull progress
                const stream = await OllamaService.pull({ model: defaultModel, stream: true });
                
                let lastStatus = '';
                let lastPercent = 0;
                for await (const part of stream) {
                    if (part.digest) {
                        if (part.completed && part.total) {
                            const percent = Math.round((part.completed / part.total) * 100);
                            if (percent > lastPercent + 10 || percent === 100) { // Log every 10%
                                logger.info('OLLAMA', `Pulling ${defaultModel}: ${percent}%`);
                                lastPercent = percent;
                            }
                        }
                    } else if (part.status !== lastStatus) {
                         logger.info('OLLAMA', `Status: ${part.status}`);
                         lastStatus = part.status;
                    }
                }
                logger.success('OLLAMA', `Successfully installed '${defaultModel}'`);
            } else {
                logger.success('OLLAMA', `Model '${defaultModel}' is ready`);
            }
            
            return; // Success, exit function

        } catch (error: any) {
            const isLastAttempt = i === maxRetries - 1;
            const isConnectionRefused = error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED';
            
            // If first attempt fails and it looks like the service is down (and local), try to start it
            if (i === 0 && isLocalHost(config.ollama.host)) {
                logger.warn('OLLAMA', 'Connection failed. Trying to start local instance...');
                const started = await startLocalOllama();
                if (started) {
                    // Give it more time to start
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
            }

            if (!isLastAttempt) {
                logger.warn('OLLAMA', `Connection failed. Retrying in ${retryDelay/1000}s... (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                logger.error('OLLAMA', 'Failed to initialize after multiple attempts');
                logger.error('OLLAMA', `Details: ${error instanceof Error ? error.message : String(error)}`);
                logger.warn('OLLAMA', 'Chat features may be unavailable until Ollama is running.');
            }
        }
    }
};

const ensureAudioSetup = async () => {
    const ttsLocal = config.tts.enabled && config.tts.provider === 'local';
    const sttLocal = config.stt.enabled && config.stt.provider === 'local';

    if (!ttsLocal && !sttLocal) return;

    // Use setup-audio.js --check to verify all files (binaries + all voices)
    const setupScript = path.join(process.cwd(), 'setup-audio.js');
    if (!fs.existsSync(setupScript)) {
        logger.error('AUDIO', 'setup-audio.js not found. Cannot verify audio stack.');
        return;
    }

    try {
        // 1. Check mode (silent, exit 1 if missing)
        await new Promise<void>((resolve, reject) => {
            const child = spawn('node', [setupScript, '--check'], { stdio: 'ignore' });
            child.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error('Missing files'));
            });
            child.on('error', reject);
        });
        logger.info('AUDIO', 'Audio stack verified (Binaries & Voices present).');
    } catch {
        // 2. Install mode (shows progress)
        logger.info('AUDIO', 'Missing audio files or voices. Starting download...');
        try {
            await new Promise<void>((resolve, reject) => {
                const child = spawn('node', [setupScript], { stdio: 'inherit' });
                child.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Setup exited with code ${code}`));
                });
                child.on('error', reject);
            });
            logger.success('AUDIO', 'Audio setup completed.');
        } catch (error) {
            logger.error('AUDIO', 'Failed to run audio setup automatically.');
            logger.error('AUDIO', error instanceof Error ? error.message : String(error));
        }
    }
};

const initializeTTS = async () => {
    if (config.tts.enabled) {
        if (config.tts.provider === 'local') {
            logger.info('TTS', `Checking Local TTS (Piper)...`);
            const isReady = await TtsService.checkHealth();
            if (!isReady) {
                logger.warn('TTS', 'Local TTS binaries not found. Please run "npm run setup:audio" to install Piper and models.');
            } else {
                logger.success('TTS', 'Local TTS (Piper) is ready');
            }
        } else {
            logger.info('TTS', `Checking TTS service at ${config.tts.url}...`);
            const isReachable = await TtsService.checkHealth();
            if (!isReachable) {
                logger.warn('TTS', 'External TTS Service is not reachable. Please ensure your OpenAI-compatible TTS server (e.g. LocalAI, Speeches) is running on port 9000.');
            } else {
                logger.success('TTS', 'External TTS Service is ready');
            }
        }
    } else {
        logger.info('TTS', 'TTS is disabled in configuration.');
    }
};

app.listen(port, async () => {
    logger.success('SERVER', `Listening on port ${port}`);
    logger.info('SERVER', `Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('DB', `PouchDB mounted at /_db`);
    
    await ensureAudioSetup();
    await initializeOllama();
    await initializeTTS();
});

