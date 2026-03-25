import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const venvPath = path.join(__dirname, '.venv');
const requirementsPath = path.join(__dirname, 'packages/chatterbox/requirements.txt');

const isWindows = process.platform === 'win32';
const pythonCmd = isWindows ? 'python' : 'python3';
const venvPython = isWindows ? path.join(venvPath, 'Scripts', 'python.exe') : path.join(venvPath, 'bin', 'python');

const pipCmd = isWindows ? path.join(venvPath, 'Scripts', 'pip.exe') : path.join(venvPath, 'bin', 'pip');

async function runCommand(command, args, cwd = __dirname) {
	return new Promise((resolve, reject) => {
		console.log(`> ${command} ${args.join(' ')}`);
		const proc = spawn(command, args, {
			cwd,
			stdio: 'inherit',
			shell: true
		});

		proc.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`Command failed with code ${code}`));
		});
	});
}

async function setup() {
	console.log('🐍 Setting up Python environment for Chatterbox...');

	// 1. Create venv if it doesn't exist
	if (!fs.existsSync(venvPath)) {
		console.log('Creating virtual environment...');
		await runCommand(pythonCmd, ['-m', 'venv', '.venv']);
	} else {
		console.log('Virtual environment already exists.');
	}

	// 2. Install requirements
	if (fs.existsSync(requirementsPath)) {
		console.log('Installing dependencies from requirements.txt...');
		// Upgrade pip first
		await runCommand(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip']);
		// Install deps
		await runCommand(venvPython, ['-m', 'pip', 'install', '-r', requirementsPath]);
	} else {
		console.error('requirements.txt not found at:', requirementsPath);
	}

	console.log('✅ Python setup complete.');
}

setup().catch((err) => {
	console.error('Setup failed:', err);
	process.exit(1);
});
