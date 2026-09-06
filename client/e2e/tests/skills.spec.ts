import { test, expect } from '@playwright/test';
import { startE2EServer, type E2EServer } from '../fixtures/e2e-server';

const SERVER_PORT = 3001;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

test.setTimeout(120 * 1000);

/**
 * Waits until the server answers /api/health.
 *
 * Readiness is deliberately not inferred from the "Listening on port" log line:
 * the server prints it before it finishes creating its PouchDB indexes, and a
 * find() issued in that window comes back empty.
 */
function waitForServer(request: any, serverProc: any, timeout = 120000) {
	const start = Date.now();
	return new Promise<void>((resolve, reject) => {
		void (async () => {
			while (Date.now() - start < timeout) {
				try {
					const r = await request.get(`${SERVER_URL}/api/health`);
					if (r.ok()) {
						resolve();
						return;
					}
				} catch {
					// server not up yet
				}
				await new Promise((r) => setTimeout(r, 500));
			}
			reject(new Error('Server did not become ready in time'));
		})().catch(reject);
	});
}

test.describe('Skills E2E', () => {
	let server: E2EServer | null = null;

	test.beforeAll(
		async () => {
			server = startE2EServer({ port: SERVER_PORT, databasePrefix: 'wollama-e2e' });

			// Forward server logs to test output to aid debugging
			server.process.stdout?.on('data', (d) => console.log('[server]', d.toString()));
			server.process.stderr?.on('data', (d) => console.error('[server]', d.toString()));

			// Do not await long readiness checks here to avoid Playwright hook timeouts.
			// The test body will perform readiness polling with generous timeouts.
		},
		{ timeout: 120000 }
	);

	test.afterAll(async () => {
		await server?.stop();
	});

	test('lists a seeded skill and invokes its builtin handler', async ({ request }) => {
		await waitForServer(request, server?.process, 120000);

		// A unique document id keeps the seed idempotent when the temp database is reused.
		const skillDoc = {
			_id: `skill:help-${Date.now()}`,
			skill_id: 'help',
			slug: 'help',
			name: 'help',
			display_name: 'Help',
			description: 'Shows help',
			is_enabled: true,
			handler_type: 'builtin',
			handler_ref: 'help'
		};

		// Seed straight into the server's PouchDB over its own HTTP surface.
		const putRes = await request.put(`${SERVER_URL}/_db/skills/${encodeURIComponent(skillDoc._id)}`, {
			data: skillDoc
		});
		expect(putRes.status()).toBeGreaterThanOrEqual(200);
		expect(putRes.status()).toBeLessThan(300);

		// Index creation races startup, so poll rather than assert once.
		await expect
			.poll(
				async () => {
					const res = await request.get(`${SERVER_URL}/api/skills?q=help`);
					if (!res.ok()) return null;
					const list = (await res.json()) as Array<{ slug: string }>;
					return list.find((skill) => skill.slug === 'help') ?? null;
				},
				{ timeout: 30_000 }
			)
			.not.toBeNull();

		// The unfiltered listing must contain it too.
		const allRes = await request.get(`${SERVER_URL}/api/skills`);
		expect(allRes.ok()).toBeTruthy();
		const all = (await allRes.json()) as Array<{ slug: string }>;
		expect(all.some((skill) => skill.slug === 'help')).toBeTruthy();

		// Invoking resolves the builtin handler and returns its output.
		const invokeRes = await request.post(`${SERVER_URL}/api/skills/help/invoke`, {
			data: { args: [] }
		});
		expect(invokeRes.ok()).toBeTruthy();
		const body = (await invokeRes.json()) as { skill_id?: string; output?: string; result?: string };
		expect(body.skill_id).toBe('help');
		expect(typeof body.output === 'string' || typeof body.result === 'string').toBeTruthy();
	});

	test('rejects an unknown skill slug', async ({ request }) => {
		await waitForServer(request, server?.process, 120000);

		const res = await request.post(`${SERVER_URL}/api/skills/does-not-exist/invoke`, { data: { args: [] } });
		expect(res.status()).toBe(404);
	});

	test('hides disabled skills from the listing', async ({ request }) => {
		await waitForServer(request, server?.process, 120000);

		const disabled = {
			_id: `skill:disabled-example-${Date.now()}`,
			skill_id: 'disabled-example',
			slug: 'disabled-example',
			name: 'disabled-example',
			display_name: 'Disabled example',
			description: 'Never listed',
			is_enabled: false,
			handler_type: 'builtin',
			handler_ref: 'help'
		};
		const putRes = await request.put(`${SERVER_URL}/_db/skills/${encodeURIComponent(disabled._id)}`, {
			data: disabled
		});
		expect(putRes.status()).toBeGreaterThanOrEqual(200);

		const res = await request.get(`${SERVER_URL}/api/skills`);
		expect(res.ok()).toBeTruthy();
		const list = (await res.json()) as Array<{ slug: string }>;
		expect(list.some((skill) => skill.slug === 'disabled-example')).toBeFalsy();
	});
});
