import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resolveIsolatedTestRuntime, TEST_PROFILE_PREFIX } from './test-runtime.js';

function createDisposableRuntimePaths() {
	const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'wollama-runtime-test-root-'));
	const profileDirectory = mkdtempSync(path.join(temporaryDirectory, TEST_PROFILE_PREFIX));
	return { temporaryDirectory, profileDirectory };
}

test('accepts an isolated disposable profile and non-production port', (context) => {
	const { temporaryDirectory, profileDirectory } = createDisposableRuntimePaths();
	context.after(() => rmSync(temporaryDirectory, { recursive: true, force: true }));

	const runtime = resolveIsolatedTestRuntime(
		{
			WOLLAMA_TEST_MODE: '1',
			WOLLAMA_TEST_PROFILE_DIR: profileDirectory,
			WOLLAMA_TEST_SERVER_PORT: '55231'
		},
		temporaryDirectory
	);

	assert.equal(runtime.profileDirectory, profileDirectory);
	assert.equal(runtime.serverPort, 55231);
	assert.equal(runtime.headless, true);
});

test('rejects disposable profiles outside the declared temporary root', (context) => {
	const { temporaryDirectory } = createDisposableRuntimePaths();
	const outsideProfileDirectory = mkdtempSync(path.join(os.tmpdir(), TEST_PROFILE_PREFIX));
	context.after(() => rmSync(temporaryDirectory, { recursive: true, force: true }));
	context.after(() => rmSync(outsideProfileDirectory, { recursive: true, force: true }));

	assert.throws(
		() =>
			resolveIsolatedTestRuntime(
				{
					WOLLAMA_TEST_MODE: '1',
					WOLLAMA_TEST_PROFILE_DIR: outsideProfileDirectory,
					WOLLAMA_TEST_SERVER_PORT: '55231'
				},
				temporaryDirectory
			),
		/disposable Wollama profile/
	);
});

test('rejects development and production ports', (context) => {
	const { temporaryDirectory, profileDirectory } = createDisposableRuntimePaths();
	context.after(() => rmSync(temporaryDirectory, { recursive: true, force: true }));

	for (const serverPort of ['3000', '3210']) {
		assert.throws(
			() =>
				resolveIsolatedTestRuntime(
					{
						WOLLAMA_TEST_MODE: '1',
						WOLLAMA_TEST_PROFILE_DIR: profileDirectory,
						WOLLAMA_TEST_SERVER_PORT: serverPort
					},
					temporaryDirectory
				),
			/non-production test port/
		);
	}
});
