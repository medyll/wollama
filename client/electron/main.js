import { app, BrowserWindow, ipcMain } from 'electron';
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

function getWindowState() {
	try {
		const data = fs.readFileSync(stateFile, 'utf8');
		return JSON.parse(data);
	} catch (e) {
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

function createWindow() {
	const splash = new BrowserWindow({
		width: 500,
		height: 300,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
		icon: path.join(__dirname, '../static/favicon.png'),
		center: true
	});
	splash.loadFile(path.join(__dirname, 'splash.html'));

	setTimeout(() => {
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
			icon: path.join(__dirname, '../../static/favicon.png'),
			show: false
		});

		mainWindow.once('ready-to-show', () => {
			mainWindow.show();
			splash.destroy();
		});

		if (isDev) {
			mainWindow.loadURL('http://localhost:5173');
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
	}, 2000);
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
	if (mainWindow === null) createWindow();
});
