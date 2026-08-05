import { lstatSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const TEST_PROFILE_PREFIX = 'wollama-packaged-smoke-';

export function resolveIsolatedTestRuntime(environment = process.env, temporaryDirectory = os.tmpdir()) {
	if (environment.WOLLAMA_TEST_MODE !== '1') return null;

	const profileDirectory = environment.WOLLAMA_TEST_PROFILE_DIR;
	const serverPort = Number(environment.WOLLAMA_TEST_SERVER_PORT);
	const resolvedTemporaryDirectory = realpathSync(path.resolve(temporaryDirectory));
	const resolvedProfileDirectory = profileDirectory ? path.resolve(profileDirectory) : '';
	const relativeProfilePath = resolvedProfileDirectory
		? path.relative(resolvedTemporaryDirectory, resolvedProfileDirectory)
		: '';

	if (
		!resolvedProfileDirectory ||
		!relativeProfilePath ||
		relativeProfilePath.startsWith('..') ||
		path.isAbsolute(relativeProfilePath) ||
		!path.basename(resolvedProfileDirectory).startsWith(TEST_PROFILE_PREFIX)
	) {
		throw new Error('Packaged test mode requires a disposable Wollama profile inside the system temporary directory.');
	}

	const profileStat = lstatSync(resolvedProfileDirectory);
	const realProfileDirectory = realpathSync(resolvedProfileDirectory);
	const realRelativeProfilePath = path.relative(resolvedTemporaryDirectory, realProfileDirectory);
	if (
		profileStat.isSymbolicLink() ||
		!profileStat.isDirectory() ||
		!realRelativeProfilePath ||
		realRelativeProfilePath.startsWith('..') ||
		path.isAbsolute(realRelativeProfilePath)
	) {
		throw new Error('Packaged test mode refuses profiles that resolve outside the system temporary directory.');
	}

	if (!Number.isInteger(serverPort) || serverPort < 1024 || serverPort > 65535 || serverPort === 3000 || serverPort === 3210) {
		throw new Error('Packaged test mode requires a non-production test port.');
	}

	return {
		profileDirectory: realProfileDirectory,
		serverPort,
		headless: true
	};
}
