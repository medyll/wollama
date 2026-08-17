import { app, BrowserWindow, utilityProcess } from 'electron';
import path from 'path';
import serve from 'electron-serve';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadURL = serve({ directory: 'build' });

const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

let mainWindow;
let serverProcess;

const SERVER_URL = 'http://127.0.0.1:3000';

async function isServerReady() {
	try {
		const response = await fetch(`${SERVER_URL}/api/health`, {
			signal: AbortSignal.timeout(1000)
		});
		return response.ok;
	} catch {
		return false;
	}
}

async function waitForServer(timeoutMs = 15000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await isServerReady()) return true;
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	return false;
}

async function startBundledServer() {
	if (!app.isPackaged || (await isServerReady())) return;

	const serverRoot = path.join(process.resourcesPath, 'wollama-server');
	const serverEntry = path.join(serverRoot, 'dist', 'server', 'server.js');
	const audioRoot = path.join(serverRoot, 'bin');
	const dataRoot = path.join(app.getPath('userData'), 'server-data');

	serverProcess = utilityProcess.fork(serverEntry, [], {
		cwd: serverRoot,
		serviceName: 'Wollama Server',
		stdio: 'pipe',
		env: {
			...process.env,
			PORT: '3000',
			HOST: '127.0.0.1',
			DB_PATH: path.join(dataRoot, 'db'),
			RAG_VECTOR_DIR: path.join(dataRoot, 'vectors'),
			STT_BINARY_PATH: path.join(audioRoot, 'whisper', process.platform === 'win32' ? 'main.exe' : 'main'),
			STT_MODEL_PATH: path.join(audioRoot, 'whisper', 'ggml-base.bin'),
			TTS_BINARY_PATH: path.join(audioRoot, 'piper', process.platform === 'win32' ? 'piper.exe' : 'piper'),
			TTS_MODEL_DIR: path.join(audioRoot, 'piper')
		}
	});

	serverProcess.stdout?.on('data', (data) => console.log(`[Wollama Server] ${data.toString().trim()}`));
	serverProcess.stderr?.on('data', (data) => console.error(`[Wollama Server] ${data.toString().trim()}`));
	serverProcess.on('exit', (code) => {
		console.log(`Wollama Server exited with code ${code}`);
		serverProcess = undefined;
	});

	if (!(await waitForServer())) {
		console.error('Wollama Server did not become ready before the startup timeout');
	}
}

function getWindowState() {
	try {
		const data = fs.readFileSync(stateFile, 'utf8');
		return JSON.parse(data);
	} catch {
		return { width: 1200, height: 800 };
	}
}

function saveWindowState(bounds) {
	try {
		fs.writeFileSync(stateFile, JSON.stringify(bounds));
	} catch (e) {
		console.error('Failed to save window state', e);
	}
}

async function createWindow() {
	const splash = new BrowserWindow({
		width: 500,
		height: 300,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
		icon: path.join(__dirname, '../static/favicon.png'),
		center: true
	});
	await splash.loadFile(path.join(__dirname, 'splash.html'));
	await Promise.all([startBundledServer(), new Promise((resolve) => setTimeout(resolve, 1200))]);

	const state = getWindowState();

	mainWindow = new BrowserWindow({
		x: state.x,
		y: state.y,
		width: state.width,
		height: state.height,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
			// preload: path.join(__dirname, 'preload.js')
		},
		icon: path.join(__dirname, '../build/favicon.png'),
		show: false
	});

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
		splash.destroy();
	});

	if (isDev) {
		mainWindow.loadURL('http://localhost:5176');
		mainWindow.webContents.openDevTools();
	} else {
		loadURL(mainWindow);
	}

	mainWindow.on('close', () => {
		if (mainWindow) {
			saveWindowState(mainWindow.getBounds());
		}
	});

	mainWindow.on('closed', function () {
		mainWindow = null;
	});
}

app.whenReady().then(createWindow);

app.on('before-quit', () => {
	serverProcess?.kill();
	serverProcess = undefined;
});

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
	if (mainWindow === null) createWindow();
});
