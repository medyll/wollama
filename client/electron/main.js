import { app, BrowserWindow, ipcMain, utilityProcess } from 'electron';
import path from 'path';
import serve from 'electron-serve';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { BackendManager } from './backend-manager.js';
import { resolveIsolatedTestRuntime } from './test-runtime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadURL = serve({ directory: 'build' });

const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
const testRuntime = resolveIsolatedTestRuntime();
if (testRuntime) app.setPath('userData', testRuntime.profileDirectory);

const developmentServerUrl = 'http://127.0.0.1:3000';
const productionServerPort = testRuntime?.serverPort ?? 3210;
const productionServerUrl = `http://127.0.0.1:${productionServerPort}`;
const appIcon = isDev ? path.join(__dirname, '../static/favicon.png') : path.join(app.getAppPath(), 'build', 'favicon.png');
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

let mainWindow;
let backendManager;

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
	app.quit();
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

function createBackendManager() {
	const backendEntry = path.join(app.getAppPath(), 'electron', 'backend', 'server.js');
	const serverDataPath = path.join(app.getPath('userData'), 'server-data');

	return new BackendManager({
		url: productionServerUrl,
		startProcess: () => {
			const child = utilityProcess.fork(backendEntry, [], {
				cwd: app.getPath('userData'),
				env: {
					...process.env,
					NODE_ENV: 'production',
					HOST: '127.0.0.1',
					PORT: String(productionServerPort),
					DB_PATH: serverDataPath,
					SKIP_HEAVY_SETUP: 'true'
				},
				serviceName: 'Wollama Backend',
				stdio: 'pipe'
			});

			child.stdout?.on('data', (data) => console.log(`[backend] ${data.toString().trim()}`));
			child.stderr?.on('data', (data) => console.error(`[backend] ${data.toString().trim()}`));
			return child;
		}
	});
}

async function createWindow() {
	const splash = new BrowserWindow({
		width: 500,
		height: 300,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
		icon: appIcon,
		center: true,
		show: !testRuntime?.headless
	});
	splash.loadFile(path.join(__dirname, 'splash.html'));

	if (!isDev) {
		backendManager ||= createBackendManager();
		try {
			await backendManager.ensureStarted();
		} catch (error) {
			console.error('Packaged backend startup failed. The UI will offer recovery controls.', error);
		}
	}

	const state = getWindowState();
	const serverUrl = isDev ? developmentServerUrl : productionServerUrl;

	mainWindow = new BrowserWindow({
		x: state.x,
		y: state.y,
		width: state.width,
		height: state.height,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.cjs'),
			additionalArguments: [`--wollama-server-url=${serverUrl}`]
		},
		icon: appIcon,
		show: false
	});

	mainWindow.once('ready-to-show', () => {
		if (!testRuntime?.headless) mainWindow.show();
		splash.destroy();
	});

	if (isDev) {
		await mainWindow.loadURL('http://localhost:5176');
		mainWindow.webContents.openDevTools();
	} else {
		await loadURL(mainWindow);
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

app.whenReady().then(() => {
	if (!hasSingleInstanceLock) return;

	ipcMain.handle('backend:status', () => {
		if (isDev) {
			return { url: developmentServerUrl, status: 'development', error: null, managed: false };
		}

		return (
			backendManager?.getStatus() ?? {
				url: productionServerUrl,
				status: 'stopped',
				error: null,
				managed: false
			}
		);
	});

	ipcMain.handle('backend:restart', async () => {
		if (isDev) {
			return { url: developmentServerUrl, status: 'development', error: null, managed: false };
		}

		backendManager ||= createBackendManager();
		try {
			return await backendManager.restart();
		} catch {
			return backendManager.getStatus();
		}
	});

	createWindow().catch((error) => {
		console.error('Failed to create the main window', error);
	});
});

app.on('second-instance', () => {
	if (!mainWindow) return;
	if (mainWindow.isMinimized()) mainWindow.restore();
	mainWindow.focus();
});

app.on('before-quit', () => {
	backendManager?.stop();
});

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
	if (mainWindow === null) {
		createWindow().catch((error) => {
			console.error('Failed to recreate the main window', error);
		});
	}
});
