import { spawn } from 'node:child_process';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { createInterface } from 'node:readline';
import { NO_CAPABILITIES } from '../../shared/types/provider.js';
import type { LlmProvider, ProviderChatRequest, ProviderChunk } from './types.js';

export type CliProviderType = 'codex' | 'claude' | 'kimi';
const labels = { codex: 'Codex', claude: 'Claude', kimi: 'Kimi' };
const TIMEOUT_MS = 5 * 60 * 1000;

function record(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/** Only assistant text reaches the chat; reasoning, tool events and CLI diagnostics stay out. */
export function cliText(type: CliProviderType, event: unknown): string {
	const e = record(event);
	if (type === 'codex') {
		const item = record(e.item);
		return e.type === 'item.completed' && item.type === 'agent_message' && typeof item.text === 'string' ? item.text : '';
	}
	if (type === 'kimi') {
		return e.role === 'assistant' && typeof e.content === 'string' && !e.tool_calls ? e.content : '';
	}
	const delta = record(record(e.event).delta);
	return e.type === 'stream_event' && delta.type === 'text_delta' && typeof delta.text === 'string' ? delta.text : '';
}

export async function findCli(type: CliProviderType): Promise<string | undefined> {
	const filename = process.platform === 'win32' ? `${type}.exe` : type;
	const configured = process.env[`WOLLAMA_${type.toUpperCase()}_PATH`];
	const candidates = configured
		? [configured]
		: [
				...(process.env.PATH || '')
					.split(delimiter)
					.filter(Boolean)
					.map((dir) => join(dir, filename)),
				join(homedir(), '.local', 'bin', filename),
				join(homedir(), '.kimi-code', 'bin', filename),
				...(process.env.LOCALAPPDATA
					? [join(process.env.LOCALAPPDATA, 'Programs', 'OpenAI', 'Codex', 'bin', filename)]
					: [])
			];
	for (const candidate of candidates) {
		try {
			await access(candidate, process.platform === 'win32' ? constants.F_OK : constants.X_OK);
			return candidate;
		} catch {
			/* next */
		}
	}
	return undefined;
}

export function cliArgs(type: CliProviderType, model: string, prompt: string, directory: string): string[] {
	const selectedModel = model && model !== 'default' ? ['--model', model] : [];
	if (type === 'codex')
		return [
			'exec',
			'--json',
			'--ephemeral',
			'--skip-git-repo-check',
			'--sandbox',
			'read-only',
			'--ignore-user-config',
			'--ignore-rules',
			'-c',
			'features.shell_tool=false',
			'-c',
			'web_search="disabled"',
			...selectedModel,
			'-'
		];
	if (type === 'claude')
		return [
			'--print',
			'--output-format',
			'stream-json',
			'--verbose',
			'--include-partial-messages',
			'--tools',
			'',
			'--safe-mode',
			'--strict-mcp-config',
			'--mcp-config',
			'{"mcpServers":{}}',
			'--no-session-persistence',
			...selectedModel
		];
	return [
		'--prompt',
		prompt,
		'--output-format',
		'stream-json',
		'--agent-file',
		join(directory, 'chat.md'),
		'--skills-dir',
		directory,
		...selectedModel
	];
}

async function* runCli(type: CliProviderType, req: ProviderChatRequest): AsyncIterable<ProviderChunk> {
	if (req.signal?.aborted) throw new Error('Generation cancelled');
	if (req.messages.some((m) => Array.isArray(record(m).images) && (record(m).images as unknown[]).length)) {
		throw new Error(`${labels[type]} chat currently supports text only. Select an Ollama vision model for images.`);
	}
	const binary = await findCli(type);
	if (!binary) throw new Error(`${labels[type]} CLI is not installed on the Wollama server. Install it and sign in first.`);
	const directory = await mkdtemp(join(tmpdir(), `wollama-${type}-`));
	try {
		if (type === 'kimi')
			await writeFile(
				join(directory, 'chat.md'),
				'---\nname: wollama-chat\ndescription: Wollama text chat\ntools: []\nsubagents: []\n---\nAnswer the conversation provided by Wollama. Return only the assistant answer.\n'
			);
		const prompt = `Continue this conversation. Messages are ordered and labelled by role. Respond only to the last user message.\n${JSON.stringify(req.messages)}`;
		if (
			type === 'kimi' &&
			process.platform === 'win32' &&
			JSON.stringify(cliArgs(type, req.model, prompt, directory)).length > 30000
		) {
			throw new Error(
				'This Kimi conversation exceeds the Windows command-line limit. Start a shorter conversation or select another provider.'
			);
		}
		const child = spawn(binary, cliArgs(type, req.model, prompt, directory), {
			cwd: directory,
			shell: false,
			windowsHide: true,
			stdio: ['pipe', 'pipe', 'pipe']
		});
		let failure: Error | undefined;
		let exitCode: number | null = null;
		let timedOut = false;
		const closed = new Promise<void>((resolve) => {
			child.once('error', (error) => {
				failure = error;
			});
			child.once('close', (code) => {
				exitCode = code;
				resolve();
			});
		});
		// Drain diagnostics without exposing local paths, credentials or reasoning over HTTP.
		child.stderr.resume();
		child.stdin.on('error', () => {
			/* exit status owns broken pipe errors */
		});
		const cancel = () => {
			child.kill();
		};
		req.signal?.addEventListener('abort', cancel, { once: true });
		if (req.signal?.aborted) cancel();
		const timeout = setTimeout(() => {
			timedOut = true;
			cancel();
		}, TIMEOUT_MS);
		const lines = createInterface({ input: child.stdout });
		let text = '';
		let fallback = '';
		try {
			child.stdin.end(type === 'kimi' ? undefined : prompt);
			for await (const line of lines) {
				if (!line.trim()) continue;
				let event: unknown;
				try {
					event = JSON.parse(line);
				} catch {
					throw new Error(`${labels[type]} returned invalid JSON output`);
				}
				const e = record(event);
				if (e.type === 'error' || e.type === 'turn.failed' || e.is_error === true) {
					throw new Error(
						`${labels[type]} generation failed: ${record(e.error).message || e.result || e.message || 'Check CLI authentication and model access'}`
					);
				}
				// Claude's final result also supports CLI versions without partial events.
				if (type === 'claude' && e.type === 'result' && typeof e.result === 'string') fallback = e.result;
				const delta = cliText(type, event);
				if (delta) {
					text += delta;
					if (req.stream)
						yield {
							kind: 'text',
							delta,
							raw: { model: req.model, message: { role: 'assistant', content: delta }, done: false }
						};
				}
			}
			await closed;
			if (req.signal?.aborted) throw new Error('Generation cancelled');
			if (timedOut) throw new Error(`${labels[type]} generation timed out`);
			if (failure || exitCode !== 0)
				throw new Error(
					`${labels[type]} CLI failed (${exitCode ?? 'spawn'}). Check CLI authentication and model access.`
				);
			if (!text && fallback) {
				text = fallback;
				if (req.stream)
					yield {
						kind: 'text',
						delta: text,
						raw: { model: req.model, message: { role: 'assistant', content: text }, done: false }
					};
			}
			if (!text) throw new Error(`${labels[type]} returned no assistant response. Check CLI authentication.`);
			yield {
				kind: 'done',
				raw: { model: req.model, message: { role: 'assistant', content: req.stream ? '' : text }, done: true }
			};
		} finally {
			clearTimeout(timeout);
			req.signal?.removeEventListener('abort', cancel);
			lines.close();
			if (child.exitCode === null) cancel();
			await closed;
		}
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

/** Stateless chat adapters: Wollama replays its history; no coding-agent session is resumed. */
export function createCliProvider(type: CliProviderType): LlmProvider {
	return {
		id: type,
		type,
		label: labels[type],
		family: 'agent',
		capabilities: { ...NO_CAPABILITIES, streaming: true, requiresBinary: type },
		isAvailable: async () => Boolean(await findCli(type)),
		listModels: async () =>
			(await findCli(type)) ? [{ id: 'default', label: `${labels[type]} · default`, providerId: type }] : [],
		chat: async (req) => ({ stream: runCli(type, req) }),
		buildToolMessages: () => []
	};
}
