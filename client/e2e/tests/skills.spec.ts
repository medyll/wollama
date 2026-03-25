import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER_DIR = path.join(ROOT, 'server');
const SERVER_PORT = 3001;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

test.setTimeout(120 * 1000);

function waitForServer(request: any, serverProc: any, timeout = 120000) {
  const start = Date.now();
  return new Promise<void>(async (resolve, reject) => {
    let resolved = false;

    const checkHealth = async () => {
      try {
        const r = await request.get(`${SERVER_URL}/api/health`);
        if (r.ok()) {
          resolved = true;
          resolve();
        }
      } catch (e) {
        // ignore
      }
    };

    // Listen for server stdout message as an early indicator
    const onData = (d: Buffer) => {
      const s = d.toString();
      if (s.includes('Listening on port') || s.includes('Listening on')) {
        resolved = true;
        resolve();
      }
    };

    serverProc.stdout?.on('data', onData);

    while (!resolved && Date.now() - start < timeout) {
      await checkHealth();
      if (resolved) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    serverProc.stdout?.off('data', onData);

    if (!resolved) reject(new Error('Server did not become ready in time'));
  });
}

test.describe('Skills E2E', () => {
  let serverProc: ChildProcess | null = null;

  test.beforeAll(async ({ request }) => {
    // Start the server using the locally installed tsx binary so we run the TypeScript entrypoint
    const tsxCmd = path.join(SERVER_DIR, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');

    // Use an isolated temporary DB path to avoid clashes with other running servers
    const tmpDir = path.join(os.tmpdir(), `wollama-e2e-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    const spawnEnv = { ...process.env, DB_PATH: tmpDir, PORT: String(SERVER_PORT), SKIP_HEAVY_SETUP: 'true' };

    if (process.platform === 'win32') {
      // On Windows, execute via cmd to run the .cmd wrapper
      serverProc = spawn('cmd', ['/c', tsxCmd, 'server.ts'], {
        cwd: SERVER_DIR,
        env: spawnEnv,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } else {
      serverProc = spawn(tsxCmd, ['server.ts'], {
        cwd: SERVER_DIR,
        env: spawnEnv,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    }

    // Forward server logs to test output to aid debugging
    serverProc.stdout?.on('data', (d) => console.log('[server]', d.toString()));
    serverProc.stderr?.on('data', (d) => console.error('[server]', d.toString()));

    // Do not await long readiness checks here to avoid Playwright hook timeouts.
    // The test body will perform readiness polling with generous timeouts.
  }, { timeout: 120000 });

  test.afterAll(async () => {
    if (serverProc) {
      try {
        serverProc.kill();
      } catch (e) {
        // ignore
      }
    }
  });

  test('autocomplete list and invoke builtin skill', async ({ request }) => {
    // Wait for server readiness (health or stdout) with extended timeout
    console.log('E2E: waiting for server readiness...');
    await waitForServer(request, serverProc, 120000);
    console.log('E2E: waitForServer resolved');
    // Proceed to seeding directly; the PUT will create the DB/doc if needed.
    // Seed a sample skill into the server PouchDB via the express-pouchdb HTTP API
    const skillDoc = {
      _id: 'skill:help',
      skill_id: 'help',
      slug: 'help',
      name: 'help',
      display_name: 'Help',
      description: 'Shows help',
      is_enabled: true,
      handler_type: 'builtin',
      handler_ref: 'help'
    };

    console.log('E2E: seeding skill via PUT');
    const putRes = await request.put(`${SERVER_URL}/_db/skills/${encodeURIComponent(skillDoc._id)}`, {
      data: skillDoc
    });
    console.log('E2E: PUT status', putRes.status());
    expect(putRes.status()).toBeGreaterThanOrEqual(200);

    // Search for the skill via the API
    console.log('E2E: searching for skill via API');
    const listRes = await request.get(`${SERVER_URL}/api/skills?q=help`);
    console.log('E2E: list status', listRes.status());
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    expect(Array.isArray(list)).toBeTruthy();
    expect(list.find((s: any) => s.slug === 'help')).toBeTruthy();

    // Invoke the builtin skill
    console.log('E2E: invoking skill');
    const invokeRes = await request.post(`${SERVER_URL}/api/skills/help/invoke`, {
      data: { input: 'How do I use this app?' }
    });
    console.log('E2E: invoke status', invokeRes.status());
    expect(invokeRes.ok()).toBeTruthy();
    const body = await invokeRes.json();
    // Builtin help handler returns an 'output' field in our implementations
    expect(body).toBeDefined();
    expect(typeof body.output === 'string' || typeof body.result === 'string').toBeTruthy();
  });
});
