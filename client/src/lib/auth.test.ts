import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./state/user.svelte', () => {
	const setAuth = vi.fn();
	const logout = vi.fn();
	const userState = { setAuth, logout, isAuthenticated: true, uid: 'user_1', token: 'token' };
	return { userState };
});

vi.mock('./db', () => {
	return {
		getDatabase: vi.fn().mockResolvedValue({}),
		enableReplication: vi.fn().mockResolvedValue(undefined),
		disableReplication: vi.fn().mockResolvedValue(undefined)
	};
});

import { authService } from './auth';

describe('AuthService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('signInWithGoogle sets auth and starts replication', async () => {
		vi.useFakeTimers();
		const promise = authService.signInWithGoogle();
		vi.advanceTimersByTime(1000);
		const user = await promise;
		vi.useRealTimers();

		expect(user).toHaveProperty('email', 'user@example.com');

		const { userState } = await import('./state/user.svelte');
		expect(userState.setAuth).toHaveBeenCalled();
	});

	it('signOut stops replication and logs out', async () => {
		await authService.signOut();
		const { userState } = await import('./state/user.svelte');
		expect(userState.logout).toHaveBeenCalled();
	});
});
