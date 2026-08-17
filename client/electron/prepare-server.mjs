import { rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const clientRoot = process.cwd();
const serverTarget = path.join(clientRoot, 'resources', 'wollama-server');
const pnpmCli = process.env.npm_execpath;

if (!pnpmCli) {
	throw new Error('Unable to locate pnpm. Run this script through the package command.');
}

function runPnpm(args) {
	const result = spawnSync(process.execPath, [pnpmCli, ...args], {
		cwd: clientRoot,
		env: { ...process.env, CI: 'true' },
		stdio: 'inherit'
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

rmSync(serverTarget, { recursive: true, force: true });
runPnpm(['--filter', '@wollama/server', 'build']);
runPnpm(['--filter', '@wollama/server', 'deploy', '--prod', '--legacy', serverTarget]);

// pnpm's legacy deploy creates a self-referencing workspace link that 7-Zip
// cannot resolve while building the Windows installer.
rmSync(path.join(serverTarget, 'node_modules', '.pnpm', 'node_modules', '@wollama', 'server'), {
	recursive: true,
	force: true
});
