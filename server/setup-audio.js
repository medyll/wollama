import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import AdmZip from 'adm-zip';

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');

const BIN_DIR = path.join(process.cwd(), 'bin');
const PIPER_DIR = path.join(BIN_DIR, 'piper');
const WHISPER_DIR = path.join(BIN_DIR, 'whisper');

const PLATFORM = process.platform; // 'win32', 'linux', 'darwin'
const ARCH = process.arch; // 'x64', 'arm64'

if (!CHECK_ONLY) {
	console.log(`Setup Audio: Detected ${PLATFORM} (${ARCH})`);
}

// Ensure directories exist
if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR);
if (!fs.existsSync(PIPER_DIR)) fs.mkdirSync(PIPER_DIR, { recursive: true });
if (!fs.existsSync(WHISPER_DIR)) fs.mkdirSync(WHISPER_DIR, { recursive: true });

const checkFile = (path) => {
	if (!fs.existsSync(path)) {
		if (CHECK_ONLY) process.exit(1);
		return false;
	}
	return true;
};

const downloadFile = (url, dest) => {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		https
			.get(url, (response) => {
				if (response.statusCode === 302 || response.statusCode === 301) {
					downloadFile(response.headers.location, dest).then(resolve).catch(reject);
					return;
				}

				const total = parseInt(response.headers['content-length'], 10);
				let cur = 0;

				response.pipe(file);

				if (!CHECK_ONLY && total) {
					response.on('data', (chunk) => {
						cur += chunk.length;
						const percent = ((cur / total) * 100).toFixed(1);
						process.stdout.write(`\rDownloading... ${percent}%`);
					});
				}

				file.on('finish', () => {
					if (!CHECK_ONLY && total) process.stdout.write('\n');
					file.close(resolve);
				});
			})
			.on('error', (err) => {
				fs.unlink(dest, () => reject(err));
			});
	});
};

const extractZip = (zipPath, destDir) => {
	if (!CHECK_ONLY) console.log(`Extracting ${path.basename(zipPath)}...`);
	const zip = new AdmZip(zipPath);
	zip.extractAllTo(destDir, true);
};

const extractTarGz = (tarPath, destDir) => {
	if (!CHECK_ONLY) console.log(`Extracting ${path.basename(tarPath)}...`);
	try {
		execSync(`tar -xzf "${tarPath}" -C "${destDir}"`);
	} catch (e) {
		console.error('Error extracting tar.gz. Ensure "tar" is installed.', e);
		process.exit(1);
	}
};

const setupPiper = async () => {
	if (!CHECK_ONLY) console.log('\n--- Setting up Piper (TTS) ---');

	let piperUrl = '';
	let archiveName = '';
	const version = '2023.11.14-2';

	if (PLATFORM === 'win32') {
		piperUrl = `https://github.com/rhasspy/piper/releases/download/${version}/piper_windows_amd64.zip`;
		archiveName = 'piper.zip';
	} else if (PLATFORM === 'linux') {
		const arch = ARCH === 'arm64' ? 'aarch64' : 'x86_64';
		piperUrl = `https://github.com/rhasspy/piper/releases/download/${version}/piper_linux_${arch}.tar.gz`;
		archiveName = 'piper.tar.gz';
	} else if (PLATFORM === 'darwin') {
		const arch = ARCH === 'arm64' ? 'aarch64' : 'x64';
		piperUrl = `https://github.com/rhasspy/piper/releases/download/${version}/piper_macos_${arch}.tar.gz`;
		archiveName = 'piper.tar.gz';
	} else {
		console.error('Unsupported platform for Piper auto-setup.');
		return;
	}

	const archivePath = path.join(BIN_DIR, archiveName);
	const exeName = PLATFORM === 'win32' ? 'piper.exe' : 'piper';
	const expectedExe = path.join(PIPER_DIR, exeName);

	if (checkFile(expectedExe)) {
		if (!CHECK_ONLY) console.log('Piper binary already exists.');
	} else {
		console.log(`Downloading Piper from ${piperUrl}...`);
		await downloadFile(piperUrl, archivePath);

		if (archiveName.endsWith('.zip')) {
			extractZip(archivePath, BIN_DIR);
		} else {
			extractTarGz(archivePath, BIN_DIR);
		}

		fs.unlinkSync(archivePath);
		console.log('Piper installed.');
	}

	// Download Models
	const voices = [
		{
			lang: 'en_US',
			name: 'en_US-lessac-medium',
			url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx'
		},
		{
			lang: 'fr_FR',
			name: 'fr_FR-siwis-medium',
			url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx'
		},
		{
			lang: 'de_DE',
			name: 'de_DE-thorsten-medium',
			url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx'
		},
		{
			lang: 'es_ES',
			name: 'es_ES-sharvard-medium',
			url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx'
		},
		{
			lang: 'it_IT',
			name: 'it_IT-riccardo-x_low',
			url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/it/it_IT/riccardo/x_low/it_IT-riccardo-x_low.onnx'
		}
	];

	if (!CHECK_ONLY) console.log('Checking Piper Models...');
	for (const voice of voices) {
		const modelPath = path.join(PIPER_DIR, `${voice.name}.onnx`);
		const jsonPath = path.join(PIPER_DIR, `${voice.name}.onnx.json`);

		if (!checkFile(modelPath)) {
			console.log(`Downloading ${voice.name}...`);
			await downloadFile(voice.url, modelPath);
			await downloadFile(`${voice.url}.json`, jsonPath);
			console.log(`Installed ${voice.name}`);
		} else {
			if (!CHECK_ONLY) console.log(`Already installed: ${voice.name}`);
		}
	}

	if (PLATFORM !== 'win32') {
		try {
			execSync(`chmod +x "${expectedExe}"`);
		} catch (error) {
			if (!CHECK_ONLY) console.warn('Failed to set executable permissions:', error);
		}
	}
};

const setupWhisper = async () => {
	if (!CHECK_ONLY) console.log('\n--- Setting up Whisper (STT) ---');

	const exeName = PLATFORM === 'win32' ? 'main.exe' : 'main';
	const expectedExe = path.join(WHISPER_DIR, exeName);

	if (checkFile(expectedExe)) {
		if (!CHECK_ONLY) console.log('Whisper binary already exists.');
	} else {
		if (PLATFORM === 'win32') {
			const url = 'https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip';
			const zipPath = path.join(BIN_DIR, 'whisper.zip');
			console.log(`Downloading Whisper for Windows...`);
			await downloadFile(url, zipPath);

			const tempDir = path.join(BIN_DIR, 'whisper_temp');
			if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

			extractZip(zipPath, tempDir);
			fs.renameSync(path.join(tempDir, 'main.exe'), expectedExe);
			fs.rmSync(tempDir, { recursive: true, force: true });
			fs.unlinkSync(zipPath);
			console.log('Whisper installed.');
		} else {
			console.log('Downloading Whisper source code to build...');
			const url = 'https://github.com/ggerganov/whisper.cpp/archive/refs/tags/v1.5.4.zip';
			const zipPath = path.join(BIN_DIR, 'whisper_source.zip');
			await downloadFile(url, zipPath);

			const sourceDir = path.join(BIN_DIR, 'whisper.cpp-1.5.4');
			if (fs.existsSync(sourceDir)) fs.rmSync(sourceDir, { recursive: true, force: true });

			extractZip(zipPath, BIN_DIR);
			fs.unlinkSync(zipPath);

			console.log('Building Whisper (this may take a minute)...');
			try {
				execSync('make main', { cwd: sourceDir, stdio: 'inherit' });
				fs.renameSync(path.join(sourceDir, 'main'), expectedExe);
				fs.rmSync(sourceDir, { recursive: true, force: true });
				console.log('Whisper built and installed.');
			} catch (error) {
				console.error('Failed to build Whisper.', error);
			}
		}
	}

	// Download Model
	const modelName = 'ggml-base.bin';
	const modelPath = path.join(WHISPER_DIR, modelName);

	if (!checkFile(modelPath)) {
		console.log('Downloading Whisper Model (base)...');
		await downloadFile(`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${modelName}`, modelPath);
		console.log('Whisper Model installed.');
	} else {
		if (!CHECK_ONLY) console.log('Whisper Model already exists.');
	}

	if (PLATFORM !== 'win32' && fs.existsSync(expectedExe)) {
		try {
			execSync(`chmod +x "${expectedExe}"`);
		} catch (error) {
			if (!CHECK_ONLY) console.warn('Failed to set executable permissions:', error);
		}
	}
};

(async () => {
	try {
		await setupPiper();
		await setupWhisper();
		if (!CHECK_ONLY) console.log('\nAudio Stack Setup Complete!');
	} catch (e) {
		if (!CHECK_ONLY) console.error('\nSetup failed:', e);
		process.exit(1);
	}
})();
