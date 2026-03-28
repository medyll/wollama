#!/usr/bin/env node
/**
 * S6-05: Cross-Platform Build Verification Script
 * 
 * Usage: node verify-builds.js
 * 
 * This script:
 * 1. Checks Electron build configuration
 * 2. Validates Android/Capacitor configuration
 * 3. Runs type checks on all projects
 * 4. Reports any build-blocking issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const results = {
	passed: [],
	warnings: [],
	errors: []
};

function run(command, description) {
	console.log(`\n🔍 ${description}...`);
	try {
		execSync(command, { stdio: 'pipe', cwd: ROOT });
		console.log(`✅ ${description}`);
		results.passed.push(description);
		return true;
	} catch (error) {
		console.error(`❌ ${description}`);
		results.errors.push({ description, error: error.message });
		return false;
	}
}

function checkFile(filePath, description) {
	const fullPath = path.join(ROOT, filePath);
	if (fs.existsSync(fullPath)) {
		console.log(`✅ ${description} exists`);
		results.passed.push(description);
		return true;
	} else {
		console.error(`❌ ${description} missing: ${filePath}`);
		results.errors.push({ description: `${description} missing`, error: filePath });
		return false;
	}
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Wollama Build Verification (S6-05)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 1. Check configuration files
console.log('\n📁 Checking configuration files...');
checkFile('client/electron/main.js', 'Electron main process');
checkFile('client/capacitor.config.ts', 'Capacitor config');
checkFile('client/package.json', 'Client package.json');
checkFile('server/package.json', 'Server package.json');

// 2. Check Electron build config
console.log('\n🖥️  Electron Configuration...');
const clientPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/package.json'), 'utf-8'));
if (clientPkg.build) {
	console.log('✅ Electron build config found');
	results.passed.push('Electron build config');
	
	if (clientPkg.build.appId) {
		console.log(`   App ID: ${clientPkg.build.appId}`);
	}
	if (clientPkg.build.win?.target) {
		console.log(`   Windows target: ${clientPkg.build.win.target}`);
	}
	if (clientPkg.build.mac?.target) {
		console.log(`   macOS target: ${clientPkg.build.mac.target}`);
	}
	if (clientPkg.build.linux?.target) {
		console.log(`   Linux target: ${clientPkg.build.linux.target}`);
	}
} else {
	console.error('❌ Electron build config missing');
	results.errors.push({ description: 'Electron build config', error: 'Not found in client/package.json' });
}

// 3. Check Capacitor config
console.log('\n📱 Capacitor Configuration...');
try {
	const capacitorConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/capacitor.config.json'), 'utf-8'));
	console.log('✅ Capacitor config found');
	results.passed.push('Capacitor config');
	
	if (capacitorConfig.appId) {
		console.log(`   App ID: ${capacitorConfig.appId}`);
	}
	if (capacitorConfig.android) {
		console.log('   Android platform configured');
	}
} catch (e) {
	// Try .ts version
	if (fs.existsSync(path.join(ROOT, 'client/capacitor.config.ts'))) {
		console.log('✅ Capacitor config (TypeScript) found');
		results.passed.push('Capacitor config (TS)');
	} else {
		console.error('⚠️  Capacitor config not found');
		results.warnings.push('Capacitor config missing');
	}
}

// 4. Run type checks
console.log('\n🔍 Running type checks...');
run('npm run check', 'Type check all projects');

// 5. Check build artifacts directories
console.log('\n📦 Checking build directories...');
const buildDirs = [
	'client/build',
	'client/android',
	'client/electron'
];

buildDirs.forEach(dir => {
	const fullPath = path.join(ROOT, dir);
	if (fs.existsSync(fullPath)) {
		console.log(`✅ ${dir} exists`);
		results.passed.push(dir);
	} else {
		console.log(`⚠️  ${dir} not found (run build first)`);
		results.warnings.push(`${dir} not found`);
	}
});

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`❌ Errors: ${results.errors.length}`);

if (results.errors.length > 0) {
	console.log('\n❌ Build verification FAILED');
	console.log('\nErrors:');
	results.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e.description}: ${e.error}`));
	process.exit(1);
} else if (results.warnings.length > 0) {
	console.log('\n⚠️  Build verification PASSED with warnings');
	console.log('\nWarnings:');
	results.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
} else {
	console.log('\n✅ Build verification PASSED');
	console.log('\nNext steps:');
console.log('  1. Electron: npm run dev:electron');
console.log('  2. Android: npm run build && npx cap sync && npx cap run android');
}
