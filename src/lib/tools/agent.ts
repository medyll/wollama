const lockFilePath = './file.lock';
const quitAfterTime = 60000;
const logInterval = 5000;

import fs from 'fs-extra';

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

function createFileAsync(path: string = './timer.txt', content: string = ''){
    fs.ensureFileSync(path);
    fs.appendFileSync(path, Date.now().toFixed() + content + '\n');
}

async function startLog(interval: number = 60000, fn?: () => void) {
	while (true) {
		if (fn) fn();
        createFileAsync();
		await new Promise((resolve) => setTimeout(resolve, interval));
	}
}

startLog(logInterval, () => {
	console.log('Log', Date.now());
});
createLockFile();

const timerObj = {
	startTime: Date.now(),
	currentTime: Date.now()
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
