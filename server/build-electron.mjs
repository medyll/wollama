import { readFile } from 'node:fs/promises';
import { cpSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(serverDirectory, '..');
const outputDirectory = path.resolve(projectRoot, 'client', 'electron', 'backend');
const expectedParent = path.resolve(projectRoot, 'client', 'electron');
const serverRequire = createRequire(path.resolve(projectRoot, 'server', 'server.ts'));
const pouchDbRequire = createRequire(serverRequire.resolve('pouchdb/package.json'));
const leveldownDirectory = path.dirname(pouchDbRequire.resolve('leveldown/package.json'));
const expressPouchDbModules = [
	'compression',
	'routes/404',
	'routes/all-dbs',
	'routes/all-docs',
	'routes/attachments',
	'routes/bulk-docs',
	'routes/bulk-get',
	'routes/changes',
	'routes/compact',
	'routes/db',
	'routes/documents',
	'routes/revs-diff',
	'routes/root',
	'routes/session-stub',
	'routes/temp-views',
	'routes/view-cleanup',
	'routes/views'
];

const bundleExpressPouchDbModules = {
	name: 'bundle-express-pouchdb-modules',
	setup(buildContext) {
		buildContext.onLoad({ filter: /express-pouchdb[\\/]lib[\\/]index\.js$/ }, async ({ path: sourcePath }) => {
			const moduleMap = expressPouchDbModules
				.map((moduleName) => `  ${JSON.stringify(moduleName)}: require(${JSON.stringify(`./${moduleName}`)})`)
				.join(',\n');
			const source = await readFile(sourcePath, 'utf8');
			const contents = source
				.replace('var modes = {};', `var bundledModules = {\n${moduleMap}\n};\n\nvar modes = {};`)
				.replace("require('./' + file)(app);", 'bundledModules[file](app);');

			return { contents, loader: 'js' };
		});
	}
};

if (path.dirname(outputDirectory) !== expectedParent || path.basename(outputDirectory) !== 'backend') {
	throw new Error(`Refusing to clear unexpected Electron backend path: ${outputDirectory}`);
}

rmSync(outputDirectory, { recursive: true, force: true });

await build({
	entryPoints: [path.resolve(projectRoot, 'server', 'server.ts')],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node20',
	external: ['ffmpeg-static'],
	plugins: [bundleExpressPouchDbModules],
	banner: {
		js: [
			"import { createRequire } from 'node:module';",
			"import { fileURLToPath as __wollamaFileURLToPath } from 'node:url';",
			"import { dirname as __wollamaDirname } from 'node:path';",
			'const require = createRequire(import.meta.url);',
			'globalThis.__filename = __wollamaFileURLToPath(import.meta.url);',
			'globalThis.__dirname = __wollamaDirname(globalThis.__filename);'
		].join('\n')
	},
	outfile: path.resolve(outputDirectory, 'server.js'),
	logLevel: 'info'
});

cpSync(path.join(leveldownDirectory, 'prebuilds'), path.join(outputDirectory, 'prebuilds'), { recursive: true });
