import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename } from 'node:path';
import { cliArgs, cliText, createCliProvider } from './cli.provider.js';
import { providerModelKey, resolveProviderModel } from '../../shared/types/provider.js';

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn: spawnMock }));

function processFixture(lines: unknown[], code = 0, stayOpen = false): ChildProcessWithoutNullStreams {
	const child = new EventEmitter() as ChildProcessWithoutNullStreams;
	Object.assign(child, { stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough(), exitCode: null });
	const finish = (exit: number) => {
		Object.assign(child, { exitCode: exit });
		child.stdout.end();
		child.stderr.end();
		child.emit('close', exit);
	};
	child.kill = vi.fn(() => {
		finish(1);
		return true;
	});
	child.stdin.on('finish', () => {
		for (const line of lines) child.stdout.write(`${JSON.stringify(line)}\n`);
		if (!stayOpen) finish(code);
	});
	spawnMock.mockReturnValue(child);
	return child;
}

describe('local CLI providers', () => {
	beforeEach(() => {
		spawnMock.mockReset();
		// A known executable avoids depending on a developer machine's installed CLI.
		vi.stubEnv('WOLLAMA_CODEX_PATH', process.execPath);
		vi.stubEnv('WOLLAMA_CLAUDE_PATH', process.execPath);
		vi.stubEnv('WOLLAMA_KIMI_PATH', process.execPath);
	});

	it('providerModelKey_shouldPreserveOllamaAndRoundTripScopedModels', () => {
		expect(providerModelKey('ollama', 'mistral:latest')).toBe('mistral:latest');
		expect(resolveProviderModel('mistral:latest')).toEqual({ providerId: 'ollama', model: 'mistral:latest' });
		expect(resolveProviderModel(providerModelKey('kimi', 'vendor/model'))).toEqual({
			providerId: 'kimi',
			model: 'vendor/model'
		});
	});

	it('cliText_shouldFilterReasoningAndToolEvents', () => {
		expect(cliText('codex', { type: 'item.completed', item: { type: 'reasoning', text: 'private' } })).toBe('');
		expect(cliText('kimi', { role: 'tool', content: 'private' })).toBe('');
		expect(
			cliText('claude', { type: 'stream_event', event: { delta: { type: 'thinking_delta', thinking: 'private' } } })
		).toBe('');
		expect(cliText('kimi', { role: 'assistant', content: 'bonjour' })).toBe('bonjour');
	});

	it('cliArgs_shouldKeepPromptsOutOfShellAndRestrictAgentTools', () => {
		expect(cliArgs('codex', 'default', 'secret', 'tmp')).toContain('read-only');
		expect(cliArgs('codex', 'default', 'secret', 'tmp')).not.toContain('secret');
		expect(cliArgs('claude', 'default', 'secret', 'tmp')).toContain('--safe-mode');
		expect(cliArgs('kimi', 'default', 'secret', 'tmp')).toContain('--agent-file');
	});

	it('chat_shouldStreamCodexTextAndCleanItsDisposableDirectory', async () => {
		processFixture([{ type: 'item.completed', item: { type: 'agent_message', text: 'Bonjour' } }]);
		const turn = await createCliProvider('codex').chat({
			model: 'default',
			messages: [{ role: 'user', content: 'salut' }],
			stream: true
		});
		const chunks = [];
		for await (const chunk of turn.stream) chunks.push(chunk);
		expect(chunks.map((c) => c.kind)).toEqual(['text', 'done']);
		const directory = spawnMock.mock.calls[0][2].cwd as string;
		expect(await readdir(tmpdir())).not.toContain(basename(directory));
		expect(spawnMock.mock.calls[0][2].shell).toBe(false);
	});

	it('chat_shouldReturnFullNonStreamingClaudeAnswerWithoutDuplication', async () => {
		processFixture([
			{ type: 'stream_event', event: { delta: { type: 'text_delta', text: 'Hello' } } },
			{ type: 'result', result: 'Hello' }
		]);
		const turn = await createCliProvider('claude').chat({ model: 'default', messages: [], stream: false });
		const chunks = [];
		for await (const chunk of turn.stream) chunks.push(chunk);
		expect(chunks).toHaveLength(1);
		expect(chunks[0].raw).toMatchObject({ message: { content: 'Hello' }, done: true });
	});

	it('chat_shouldSurfaceAuthenticationErrorsAndNeverReturnSuccess', async () => {
		processFixture([{ type: 'result', is_error: true, result: 'Not logged in' }], 1);
		const turn = await createCliProvider('claude').chat({ model: 'default', messages: [], stream: true });
		await expect(
			(async () => {
				for await (const _ of turn.stream) {
					/* consume */
				}
			})()
		).rejects.toThrow('Not logged in');
	});

	it('chat_shouldKillTheProcessWhenTheClientDisconnects', async () => {
		const abort = new AbortController();
		const child = processFixture([], 0, true);
		child.stdin.on('finish', () => {
			abort.abort();
		});
		const turn = await createCliProvider('codex').chat({
			model: 'default',
			messages: [],
			stream: true,
			signal: abort.signal
		});
		await expect(
			(async () => {
				for await (const _ of turn.stream) {
					/* consume */
				}
			})()
		).rejects.toThrow('cancelled');
		expect(child.kill).toHaveBeenCalled();
	});
});
