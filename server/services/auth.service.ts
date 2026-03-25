import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'wollama-dev-secret-change-in-production';
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
	userId: string;
	type: TokenType;
	exp: number; // unix ms
	iat: number; // unix ms
}

export class AuthError extends Error {
	constructor(
		message: string,
		public readonly code: 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'WRONG_TOKEN_TYPE'
	) {
		super(message);
		this.name = 'AuthError';
	}
}

function sign(payload: TokenPayload): string {
	const data = JSON.stringify(payload);
	const encoded = Buffer.from(data).toString('base64url');
	const sig = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
	return `${encoded}.${sig}`;
}

function verify(token: string): TokenPayload {
	const parts = token.split('.');
	if (parts.length !== 2) {
		throw new AuthError('Malformed token', 'INVALID_TOKEN');
	}
	const [encoded, sig] = parts;
	const expected = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
	const sigBuf = Buffer.from(sig, 'base64url');
	const expBuf = Buffer.from(expected, 'base64url');
	if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
		throw new AuthError('Invalid token signature', 'INVALID_TOKEN');
	}
	let payload: TokenPayload;
	try {
		payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
	} catch {
		throw new AuthError('Malformed token payload', 'INVALID_TOKEN');
	}
	if (Date.now() > payload.exp) {
		throw new AuthError('Token has expired', 'TOKEN_EXPIRED');
	}
	return payload;
}

export const authService = {
	/**
	 * Generate an access + refresh token pair for a user.
	 */
	generateTokens(userId: string): { accessToken: string; refreshToken: string } {
		const now = Date.now();
		const accessPayload: TokenPayload = {
			userId,
			type: 'access',
			iat: now,
			exp: now + ACCESS_TOKEN_TTL_MS
		};
		const refreshPayload: TokenPayload = {
			userId,
			type: 'refresh',
			iat: now,
			exp: now + REFRESH_TOKEN_TTL_MS
		};
		return {
			accessToken: sign(accessPayload),
			refreshToken: sign(refreshPayload)
		};
	},

	/**
	 * Validate an access token. Throws AuthError on failure.
	 */
	validateAccessToken(token: string): TokenPayload {
		const payload = verify(token);
		if (payload.type !== 'access') {
			throw new AuthError('Expected access token', 'WRONG_TOKEN_TYPE');
		}
		return payload;
	},

	/**
	 * Refresh: validate the refresh token and issue a new access token.
	 */
	refreshAccessToken(refreshToken: string): { accessToken: string } {
		const payload = verify(refreshToken);
		if (payload.type !== 'refresh') {
			throw new AuthError('Expected refresh token', 'WRONG_TOKEN_TYPE');
		}
		const now = Date.now();
		const newPayload: TokenPayload = {
			userId: payload.userId,
			type: 'access',
			iat: now,
			exp: now + ACCESS_TOKEN_TTL_MS
		};
		return { accessToken: sign(newPayload) };
	},

	/**
	 * Decode without verification (for debugging only).
	 */
	decode(token: string): TokenPayload | null {
		try {
			const encoded = token.split('.')[0];
			return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
		} catch {
			return null;
		}
	},

	// Expose TTLs for tests
	ACCESS_TOKEN_TTL_MS,
	REFRESH_TOKEN_TTL_MS
};
