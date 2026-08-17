import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createSecureFetch, BlockedRequestError, ResponseTooLargeError } from './http-security.js';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
	server = http.createServer((req, res) => {
		if (req.url === '/ok') {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('hello');
			return;
		}
		if (req.url === '/redirect') {
			res.writeHead(302, { Location: 'http://evil.example.com/steal' });
			res.end();
			return;
		}
		if (req.url === '/big') {
			res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
			res.end(Buffer.alloc(1024, 'x'));
			return;
		}
		if (req.url === '/slow') {
			// Never responds — exercises the timeout.
			return;
		}
		res.writeHead(404);
		res.end();
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	const port = typeof address === 'object' && address ? address.port : 0;
	baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
	server.close();
});

describe('createSecureFetch', () => {
	it('allows a normal request to an explicitly allowlisted local host', async () => {
		const fetchImpl = createSecureFetch({ allowPrivateHosts: ['127.0.0.1'] });
		const res = await fetchImpl(`${baseUrl}/ok`);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('hello');
	});

	it('blocks a private/loopback host when not explicitly allowlisted', async () => {
		const fetchImpl = createSecureFetch({ allowPrivateHosts: [] });
		await expect(fetchImpl(`${baseUrl}/ok`)).rejects.toThrow(BlockedRequestError);
	});

	it('blocks a redirect instead of following it, even to an allowlisted origin', async () => {
		const fetchImpl = createSecureFetch({ allowPrivateHosts: ['127.0.0.1'] });
		await expect(fetchImpl(`${baseUrl}/redirect`)).rejects.toThrow(BlockedRequestError);
	});

	it('rejects a non-http(s) scheme outright', async () => {
		const fetchImpl = createSecureFetch({ allowPrivateHosts: ['evil.example.com'] });
		await expect(fetchImpl('file:///etc/passwd')).rejects.toThrow(BlockedRequestError);
	});

	it('enforces a response size cap by erroring the stream once exceeded', async () => {
		const fetchImpl = createSecureFetch({ allowPrivateHosts: ['127.0.0.1'], maxResponseBytes: 100 });
		const res = await fetchImpl(`${baseUrl}/big`);
		await expect(async () => {
			const reader = res.body!.getReader();
			for (;;) {
				const { done } = await reader.read();
				if (done) break;
			}
		}).rejects.toThrow(ResponseTooLargeError);
	});

	it('times out a request that never responds', async () => {
		const fetchImpl = createSecureFetch({ allowPrivateHosts: ['127.0.0.1'], timeoutMs: 100 });
		await expect(fetchImpl(`${baseUrl}/slow`)).rejects.toThrow();
	});
});
