import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { isWorkspaceAllowed, resolveRealPath, resolveWorkspace } from './workspace.js';

// These exercise the real filesystem (realpathSync requires paths that actually
// exist) — a temp directory tree is built once for the whole file.
let base: string;
let allowedRoot: string;
let allowedSub: string;
let outsideDir: string;
let siblingLookingAllowed: string; // 'allowed-evil', a prefix-collision trap
let junctionInsideAllowedPointingOutside: string;

beforeAll(() => {
	base = fs.mkdtempSync(path.join(os.tmpdir(), 'wollama-workspace-test-'));
	allowedRoot = path.join(base, 'allowed');
	allowedSub = path.join(allowedRoot, 'project');
	outsideDir = path.join(base, 'outside');
	siblingLookingAllowed = path.join(base, 'allowed-evil');
	junctionInsideAllowedPointingOutside = path.join(allowedRoot, 'escape-hatch');

	fs.mkdirSync(allowedSub, { recursive: true });
	fs.mkdirSync(outsideDir, { recursive: true });
	fs.mkdirSync(siblingLookingAllowed, { recursive: true });
	fs.symlinkSync(outsideDir, junctionInsideAllowedPointingOutside, 'junction');
});

afterAll(() => {
	fs.rmSync(base, { recursive: true, force: true });
});

describe('resolveRealPath', () => {
	it('resolves an existing path', () => {
		expect(resolveRealPath(allowedRoot)).toBe(fs.realpathSync(allowedRoot));
	});

	it('returns null for a path that does not exist', () => {
		expect(resolveRealPath(path.join(base, 'does-not-exist'))).toBeNull();
	});
});

describe('isWorkspaceAllowed', () => {
	it('allows the exact allowlisted root and a real subdirectory of it', () => {
		expect(isWorkspaceAllowed(allowedRoot, [allowedRoot])).toBe(true);
		expect(isWorkspaceAllowed(allowedSub, [allowedRoot])).toBe(true);
	});

	it('denies a path outside the allowlist', () => {
		expect(isWorkspaceAllowed(outsideDir, [allowedRoot])).toBe(false);
	});

	it('denies a sibling directory whose name merely starts with the allowed root name (prefix-collision trap)', () => {
		expect(isWorkspaceAllowed(siblingLookingAllowed, [allowedRoot])).toBe(false);
	});

	it('denies a `..`-traversing path that lexically re-enters the root but is actually outside it', () => {
		const traversal = path.join(allowedRoot, '..', 'outside');
		expect(isWorkspaceAllowed(traversal, [allowedRoot])).toBe(false);
	});

	it('denies a Windows junction planted inside the allowed root that points outside it', () => {
		// Lexically this path IS under allowedRoot, but realpathSync follows the
		// junction to outsideDir — which is not covered by the allowlist.
		expect(isWorkspaceAllowed(junctionInsideAllowedPointingOutside, [allowedRoot])).toBe(false);
	});

	it('denies everything when the allowlist is empty', () => {
		expect(isWorkspaceAllowed(allowedRoot, [])).toBe(false);
	});

	it('denies a workspace path that does not exist on disk', () => {
		expect(isWorkspaceAllowed(path.join(base, 'nope'), [allowedRoot])).toBe(false);
	});
});

describe('resolveWorkspace', () => {
	it('returns the canonical resolved path when allowed', () => {
		expect(resolveWorkspace(allowedSub, [allowedRoot])).toBe(fs.realpathSync(allowedSub));
	});

	it('returns null when not allowed', () => {
		expect(resolveWorkspace(outsideDir, [allowedRoot])).toBeNull();
	});
});
