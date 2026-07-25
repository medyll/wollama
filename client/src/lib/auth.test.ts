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

	it('signOut calls disableReplication before logout', async () => {
		const { disableReplication } = await import('./db');
		const { userState } = await import('./state/user.svelte');
		await authService.signOut();
		expect(disableReplication).toHaveBeenCalled();
		expect(userState.logout).toHaveBeenCalled();
	});

	it('startSync calls enableReplication with uid and token', async () => {
		const { enableReplication, getDatabase } = await import('./db');
		const { userState } = await import('./state/user.svelte');
		// userState mock already has isAuthenticated: true, uid: 'user_1', token: 'token'
		await authService.startSync();
		expect(getDatabase).toHaveBeenCalled();
		expect(enableReplication).toHaveBeenCalledWith('user_1', 'token');
	});

	it('startSync does nothing when not authenticated', async () => {
		const { enableReplication } = await import('./db');
		const { userState } = await import('./state/user.svelte');
		// Override mock for this test
		(userState as any).isAuthenticated = false;
		await authService.startSync();
		expect(enableReplication).not.toHaveBeenCalled();
		// Restore
		(userState as any).isAuthenticated = true;
	});

	it('signInWithGoogle calls enableReplication after sign in', async () => {
		vi.useFakeTimers();
		const { enableReplication } = await import('./db');
		const promise = authService.signInWithGoogle();
		vi.advanceTimersByTime(1000);
		await promise;
		vi.useRealTimers();
		expect(enableReplication).toHaveBeenCalled();
	});
});
