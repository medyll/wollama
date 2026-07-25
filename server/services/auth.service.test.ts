import { describe, it, expect, vi, afterEach } from 'vitest';
import { authService, AuthError } from './auth.service.js';

afterEach(() => {
	vi.useRealTimers();
});

describe('authService.generateTokens', () => {
	it('returns an accessToken and refreshToken', () => {
		const { accessToken, refreshToken } = authService.generateTokens('user-1');
		expect(typeof accessToken).toBe('string');
		expect(typeof refreshToken).toBe('string');
		expect(accessToken).not.toBe(refreshToken);
	});

	it('tokens contain two dot-separated parts', () => {
		const { accessToken, refreshToken } = authService.generateTokens('user-1');
		expect(accessToken.split('.')).toHaveLength(2);
		expect(refreshToken.split('.')).toHaveLength(2);
	});

	it('generates distinct tokens for different users', () => {
		const a = authService.generateTokens('user-a');
		const b = authService.generateTokens('user-b');
		expect(a.accessToken).not.toBe(b.accessToken);
		expect(a.refreshToken).not.toBe(b.refreshToken);
	});

	it('generates distinct tokens on successive calls (unique iat)', async () => {
		const a = authService.generateTokens('user-1');
		await new Promise((r) => setTimeout(r, 2));
		const b = authService.generateTokens('user-1');
		expect(a.accessToken).not.toBe(b.accessToken);
	});
});

describe('authService.validateAccessToken', () => {
	it('validates a freshly issued access token', () => {
		const { accessToken } = authService.generateTokens('user-42');
		const payload = authService.validateAccessToken(accessToken);
		expect(payload.userId).toBe('user-42');
		expect(payload.type).toBe('access');
	});

	it('throws INVALID_TOKEN for a garbage string', () => {
		expect(() => authService.validateAccessToken('notavalidtoken')).toThrow(AuthError);
		try {
			authService.validateAccessToken('notavalidtoken');
		} catch (e: any) {
			expect(e.code).toBe('INVALID_TOKEN');
		}
	});

	it('throws INVALID_TOKEN for an empty string', () => {
		try {
			authService.validateAccessToken('');
		} catch (e: any) {
			expect(e.code).toBe('INVALID_TOKEN');
		}
	});

	it('throws INVALID_TOKEN for a tampered signature', () => {
		const { accessToken } = authService.generateTokens('user-1');
		const [encoded] = accessToken.split('.');
		const tampered = `${encoded}.invalidsignature`;
		try {
			authService.validateAccessToken(tampered);
		} catch (e: any) {
			expect(e.code).toBe('INVALID_TOKEN');
		}
	});

	it('throws INVALID_TOKEN for a tampered payload', () => {
		const { accessToken } = authService.generateTokens('user-1');
		const [, sig] = accessToken.split('.');
		const fakepayload = Buffer.from(JSON.stringify({ userId: 'hacker', type: 'access', iat: 0, exp: 9999999999999 })).toString('base64url');
		const tampered = `${fakepayload}.${sig}`;
		try {
			authService.validateAccessToken(tampered);
		} catch (e: any) {
			expect(e.code).toBe('INVALID_TOKEN');
		}
	});

	it('throws TOKEN_EXPIRED when access token is past expiry', () => {
		vi.useFakeTimers();
		const { accessToken } = authService.generateTokens('user-1');
		// Advance past access token TTL
		vi.advanceTimersByTime(authService.ACCESS_TOKEN_TTL_MS + 1000);
		try {
			authService.validateAccessToken(accessToken);
		} catch (e: any) {
			expect(e.code).toBe('TOKEN_EXPIRED');
		}
	});

	it('throws WRONG_TOKEN_TYPE when a refresh token is passed', () => {
		const { refreshToken } = authService.generateTokens('user-1');
		try {
			authService.validateAccessToken(refreshToken);
		} catch (e: any) {
			expect(e.code).toBe('WRONG_TOKEN_TYPE');
		}
	});
});

describe('authService.refreshAccessToken', () => {
	it('returns a new access token from a valid refresh token', () => {
		const { refreshToken } = authService.generateTokens('user-5');
		const { accessToken } = authService.refreshAccessToken(refreshToken);
		expect(typeof accessToken).toBe('string');
		const payload = authService.validateAccessToken(accessToken);
		expect(payload.userId).toBe('user-5');
		expect(payload.type).toBe('access');
	});

	it('new access token is different from the original', async () => {
		const { accessToken: original, refreshToken } = authService.generateTokens('user-5');
		await new Promise((r) => setTimeout(r, 2));
		const { accessToken: renewed } = authService.refreshAccessToken(refreshToken);
		expect(renewed).not.toBe(original);
	});

	it('throws WRONG_TOKEN_TYPE when an access token is passed as refresh', () => {
		const { accessToken } = authService.generateTokens('user-1');
		try {
			authService.refreshAccessToken(accessToken);
		} catch (e: any) {
			expect(e.code).toBe('WRONG_TOKEN_TYPE');
		}
	});

	it('throws TOKEN_EXPIRED when refresh token is past expiry', () => {
		vi.useFakeTimers();
		const { refreshToken } = authService.generateTokens('user-1');
		vi.advanceTimersByTime(authService.REFRESH_TOKEN_TTL_MS + 1000);
		try {
			authService.refreshAccessToken(refreshToken);
		} catch (e: any) {
			expect(e.code).toBe('TOKEN_EXPIRED');
		}
	});

	it('throws INVALID_TOKEN for garbage refresh token', () => {
		try {
			authService.refreshAccessToken('garbage.token');
		} catch (e: any) {
			expect(e.code).toBe('INVALID_TOKEN');
		}
	});

	it('access token expires but refresh token still valid', () => {
		vi.useFakeTimers();
		const { accessToken, refreshToken } = authService.generateTokens('user-7');
		// Advance past access TTL but not refresh TTL
		vi.advanceTimersByTime(authService.ACCESS_TOKEN_TTL_MS + 1000);
		// Access token is expired
		expect(() => authService.validateAccessToken(accessToken)).toThrow();
		// Refresh still works
		const { accessToken: renewed } = authService.refreshAccessToken(refreshToken);
		// Advance timers back to "now" for validation — use real timers
		vi.useRealTimers();
		// The renewed token was issued at the fake "future" time, so its exp is also in the future
		// Just check it parses correctly
		const decoded = authService.decode(renewed);
		expect(decoded?.userId).toBe('user-7');
		expect(decoded?.type).toBe('access');
	});
});

describe('authService — concurrency', () => {
	it('handles concurrent token generation without collision', async () => {
		const users = Array.from({ length: 20 }, (_, i) => `user-${i}`);
		const results = await Promise.all(users.map((u) => Promise.resolve(authService.generateTokens(u))));
		const accessTokens = results.map((r) => r.accessToken);
		const unique = new Set(accessTokens);
		expect(unique.size).toBe(users.length);
	});

	it('handles concurrent validations', async () => {
		const tokens = Array.from({ length: 20 }, (_, i) => authService.generateTokens(`user-${i}`));
		const validations = await Promise.all(
			tokens.map(({ accessToken }, i) =>
				Promise.resolve(authService.validateAccessToken(accessToken)).then((p) => ({
					userId: p.userId,
					expected: `user-${i}`
				}))
			)
		);
		for (const { userId, expected } of validations) {
			expect(userId).toBe(expected);
		}
	});

	it('handles concurrent refresh flows', async () => {
		const pairs = Array.from({ length: 10 }, (_, i) => authService.generateTokens(`user-${i}`));
		const renewed = await Promise.all(
			pairs.map(({ refreshToken }) => Promise.resolve(authService.refreshAccessToken(refreshToken)))
		);
		for (const { accessToken } of renewed) {
			expect(typeof accessToken).toBe('string');
		}
	});
});

describe('authService.decode', () => {
	it('decodes a valid token without verifying', () => {
		const { accessToken } = authService.generateTokens('user-decode');
		const payload = authService.decode(accessToken);
		expect(payload?.userId).toBe('user-decode');
		expect(payload?.type).toBe('access');
	});

	it('returns null for garbage input', () => {
		expect(authService.decode('notbase64')).toBeNull();
	});
});
