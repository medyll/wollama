const lockFilePath = './file.lock';
const quitAfterTime = 60000;
const logInterval = 10000;

import { format } from 'date-fns';
// import { fr } from 'date-fns/locale';

import fs from 'fs-extra';
import { askOllama } from './chatUtils.js';

function isNodeAgentRunning(): boolean {
	try {
		fs.accessSync(lockFilePath);
		return true;
	} catch (error) {
		return false;
	}
}

function createLockFile(): void {
	fs.writeFileSync(lockFilePath, '');
}

function removeLockFile(): void {
	fs.unlinkSync(lockFilePath);
}

function createFileAsync(path: string = './timer.txt', content: string = '') {
	fs.ensureFileSync(path);
	fs.appendFileSync(path, Date.now().toFixed() + content + '\n');
}

async function startLog(minimumInterval: number = 60000, fn?: () => void) {
	while (true) {
		const now = Date.now();
		if (fn) fn();
		createFileAsync();
		const elapsedTime = Date.now() - now;
		if (elapsedTime < minimumInterval) await new Promise((resolve) => setTimeout(resolve, minimumInterval));
	}
}

let conc: string = '--------------------------- \n  Date et heure :  ' + format(new Date(), 'dd/MM/yyyy HH:mm:ss') + '\nA Paul a 60 secondes pour prendre une decision, puis il prend cette decision. \n ----------------------------\n';

startLog(logInterval, async () => {
	console.log('Log', Date.now());
	const nowDate = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
	// execute askOllama.ts
	const red = await askOllama(
		`l'heure est maintenant ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}.
        le temps passe.
        ${conc}
        Que fait Paul ?.`
	);

	conc = '--------------------------- \n  Date et heure : ' + nowDate + '\n' + red + '\n ----------------------------\n';
	console.log(conc);
	fs.appendFileSync(lockFilePath, conc);
});

createLockFile();

const timerObj = {
	currentTime: Date.now(),
	startTime: Date.now()
};

function setCurrentTime() {
	timerObj.currentTime = Date.now();
}

function setStartTime() {
	timerObj.startTime = Date.now();
}

setStartTime();
while (true) {
	setCurrentTime();
	if (timerObj.currentTime - timerObj.startTime > quitAfterTime) break;
	await new Promise((resolve) =>
		setTimeout(() => {
			resolve(true);
		}, 1000)
	);
}

process.on('exit', () => {
	console.log('agent is exiting.');
	removeLockFile();
});
