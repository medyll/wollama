const { contextBridge, ipcRenderer } = require('electron');

const serverUrlArgument = process.argv.find((argument) => argument.startsWith('--wollama-server-url='));
const serverUrl = serverUrlArgument?.slice('--wollama-server-url='.length) || null;

contextBridge.exposeInMainWorld('wollamaDesktop', {
	serverUrl,
	getBackendStatus: () => ipcRenderer.invoke('backend:status'),
	restartBackend: () => ipcRenderer.invoke('backend:restart')
});
