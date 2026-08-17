import net from 'net';
import dns from 'dns';
import type { FetchLike } from '@modelcontextprotocol/client';

export interface HttpSecurityOptions {
	/** Hostnames explicitly trusted to resolve to a private/loopback address — the one
	 *  escape hatch, set only via server config (never by a tool, model, or client
	 *  input) for a local MCP server the user deliberately configured. */
	allowPrivateHosts?: string[];
	maxResponseBytes?: number;
	timeoutMs?: number;
}

const DEFAULT_MAX_RESPONSE_BYTES = 16 * 1024 * 1024; // 16MB
const DEFAULT_TIMEOUT_MS = 30_000;

export class BlockedRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BlockedRequestError';
	}
}

export class ResponseTooLargeError extends Error {
	constructor(limit: number) {
		super(`Response exceeded the ${limit}-byte limit`);
		this.name = 'ResponseTooLargeError';
	}
}

/** RFC1918 + loopback + link-local + IPv6 equivalents. Deliberately conservative —
 *  false positives (blocking a public IP) are cheap; false negatives are not. */
function isPrivateOrLoopbackIp(ip: string): boolean {
	const family = net.isIP(ip);
	if (family === 4) {
		const [a, b] = ip.split('.').map(Number);
		if (a === 10) return true;
		if (a === 172 && b >= 16 && b <= 31) return true;
		if (a === 192 && b === 168) return true;
		if (a === 127) return true; // loopback
		if (a === 169 && b === 254) return true; // link-local
		if (a === 0) return true;
		return false;
	}
	if (family === 6) {
		const lower = ip.toLowerCase();
		if (lower === '::1') return true; // loopback
		if (lower.startsWith('fe80:')) return true; // link-local
		if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7 unique local
		if (lower.startsWith('::ffff:')) {
			// IPv4-mapped IPv6 — check the embedded IPv4 address too.
			const mapped = lower.slice('::ffff:'.length);
			if (net.isIP(mapped) === 4) return isPrivateOrLoopbackIp(mapped);
		}
		return false;
	}
	return false;
}

function isLocalHostname(hostname: string): boolean {
	const h = hostname.toLowerCase();
	return h === 'localhost' || h.endsWith('.local');
}

async function resolvesToPrivate(hostname: string): Promise<boolean> {
	if (net.isIP(hostname)) return isPrivateOrLoopbackIp(hostname);
	if (isLocalHostname(hostname)) return true;
	try {
		const addresses = await dns.promises.lookup(hostname, { all: true });
		// Fail closed: if ANY resolved address is private, treat the host as private —
		// this is what a DNS-rebinding attempt looks like from the outside.
		return addresses.some((a) => isPrivateOrLoopbackIp(a.address));
	} catch {
		// An unresolvable host is not trustworthy either — deny.
		return true;
	}
}

async function assertHostAllowed(url: URL, allowPrivateHosts: string[]): Promise<void> {
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new BlockedRequestError(`Blocked non-HTTP(S) scheme: ${url.protocol}`);
	}
	const allowed = allowPrivateHosts.some((h) => h.toLowerCase() === url.hostname.toLowerCase());
	if (allowed) return;
	if (await resolvesToPrivate(url.hostname)) {
		throw new BlockedRequestError(`Blocked request to private/local host: ${url.hostname}`);
	}
}

function capResponseBody(response: Response, maxBytes: number): Response {
	if (!response.body) return response;
	let total = 0;
	const source = response.body;
	const capped = new ReadableStream<Uint8Array>({
		async start(controller) {
			const reader = source.getReader();
			try {
				for (;;) {
					const { done, value } = await reader.read();
					if (done) {
						controller.close();
						return;
					}
					total += value.byteLength;
					if (total > maxBytes) {
						controller.error(new ResponseTooLargeError(maxBytes));
						await reader.cancel();
						return;
					}
					controller.enqueue(value);
				}
			} catch (err) {
				controller.error(err);
			}
		}
	});
	return new Response(capped, { status: response.status, statusText: response.statusText, headers: response.headers });
}

/**
 * Builds a `FetchLike` for `StreamableHTTPClientTransportOptions.fetch` that enforces
 * the M7 network policy: HTTP(S) only, redirects blocked outright (never silently
 * followed to a different host), private/loopback/link-local destinations denied
 * unless explicitly allowlisted, a response size cap, and a per-request timeout.
 */
export function createSecureFetch(opts: HttpSecurityOptions = {}): FetchLike {
	const allowPrivateHosts = opts.allowPrivateHosts ?? [];
	const maxResponseBytes = opts.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
	const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	return async (input, init) => {
		const url = new URL(typeof input === 'string' ? input : input.toString());
		await assertHostAllowed(url, allowPrivateHosts);

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
		const externalSignal = init?.signal;
		if (externalSignal) {
			if (externalSignal.aborted) controller.abort(externalSignal.reason);
			else externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true });
		}

		try {
			const response = await fetch(url, { ...init, redirect: 'manual', signal: controller.signal });
			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get('location') ?? '(no Location header)';
				throw new BlockedRequestError(`Blocked redirect to ${location} — redirects are never followed automatically`);
			}
			return capResponseBody(response, maxResponseBytes);
		} finally {
			clearTimeout(timer);
		}
	};
}
