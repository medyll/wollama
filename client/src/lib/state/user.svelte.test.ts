import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserState } from './user.svelte';

// $app/environment is mocked in vitest.setup.ts → browser: true
// localStorage is mocked in vitest.setup.ts (in-memory)

describe('UserState', () => {
	let user: UserState;

	beforeEach(() => {
		localStorage.clear();
		user = new UserState();
	});

	// ── Constructor ────────────────────────────────────────────────────────────

	describe('constructor – fresh start', () => {
		it('has default auth state', () => {
			expect(user.isAuthenticated).toBe(false);
			expect(user.uid).toBeNull();
			expect(user.email).toBeNull();
			expect(user.token).toBeNull();
			expect(user.isSecured).toBe(false);
		});

		it('has default preferences', () => {
			expect(user.preferences.ollamaUrl).toBe('http://localhost:11434');
			expect(user.preferences.locale).toBe('en');
			expect(user.preferences.theme).toBe('fluent-light');
		});
	});

	describe('constructor – hydration from localStorage', () => {
		it('restores auth state when uid is stored', () => {
			localStorage.setItem(
				'wollama_user',
				JSON.stringify({
					nickname: 'Alice',
					uid: 'abc123',
					email: 'alice@example.com',
					photoURL: 'https://example.com/photo.png',
					password: null,
					preferences: {}
				})
			);
			const restored = new UserState();
			expect(restored.isAuthenticated).toBe(true);
			expect(restored.uid).toBe('abc123');
			expect(restored.email).toBe('alice@example.com');
			expect(restored.nickname).toBe('Alice');
			expect(restored.isConfigured).toBe(true);
		});

		it('restores local protection when password is stored', () => {
			localStorage.setItem('wollama_user', JSON.stringify({ password: 'secret', preferences: {} }));
			const restored = new UserState();
			expect(restored.isSecured).toBe(true);
			expect(restored.password).toBe('secret');
		});

		it('merges stored preferences with defaults', () => {
			localStorage.setItem('wollama_user', JSON.stringify({ preferences: { theme: 'dark', locale: 'fr' } }));
			const restored = new UserState();
			expect(restored.preferences.theme).toBe('dark');
			expect(restored.preferences.locale).toBe('fr');
			// default untouched
			expect(restored.preferences.ollamaUrl).toBe('http://localhost:11434');
		});

		it('does not set isAuthenticated when uid is absent', () => {
			localStorage.setItem('wollama_user', JSON.stringify({ nickname: 'Bob', preferences: {} }));
			const restored = new UserState();
			expect(restored.isAuthenticated).toBe(false);
		});
	});

	// ── setAuth ────────────────────────────────────────────────────────────────

	describe('setAuth', () => {
		const mockUser = {
			uid: 'uid_test',
			email: 'test@example.com',
			photoURL: 'https://example.com/photo.png',
			token: 'jwt_token_xyz'
		};

		it('sets auth fields', () => {
			user.setAuth(mockUser);
			expect(user.uid).toBe('uid_test');
			expect(user.email).toBe('test@example.com');
			expect(user.photoURL).toBe('https://example.com/photo.png');
			expect(user.token).toBe('jwt_token_xyz');
			expect(user.isAuthenticated).toBe(true);
		});

		it('persists to localStorage', () => {
			user.setAuth(mockUser);
			const stored = JSON.parse(localStorage.getItem('wollama_user')!);
			expect(stored.uid).toBe('uid_test');
			expect(stored.email).toBe('test@example.com');
		});

		it('sets isConfigured to true', () => {
			user.setAuth(mockUser);
			expect(user.isConfigured).toBe(true);
		});

		it('accepts null email and photoURL', () => {
			user.setAuth({ uid: 'u1', email: null, photoURL: null, token: 'tok' });
			expect(user.email).toBeNull();
			expect(user.photoURL).toBeNull();
			expect(user.isAuthenticated).toBe(true);
		});
	});

	// ── setLocalProtection ─────────────────────────────────────────────────────

	describe('setLocalProtection', () => {
		it('sets password and isSecured', () => {
			user.setLocalProtection('mypassword');
			expect(user.password).toBe('mypassword');
			expect(user.isSecured).toBe(true);
		});

		it('persists password to localStorage', () => {
			user.setLocalProtection('mypassword');
			const stored = JSON.parse(localStorage.getItem('wollama_user')!);
			expect(stored.password).toBe('mypassword');
		});
	});

	// ── logout ─────────────────────────────────────────────────────────────────

	describe('logout', () => {
		it('clears auth fields', () => {
			user.setAuth({ uid: 'u1', email: 'a@b.com', photoURL: null, token: 'tok' });
			user.logout();
			expect(user.uid).toBeNull();
			expect(user.email).toBeNull();
			expect(user.photoURL).toBeNull();
			expect(user.token).toBeNull();
			expect(user.isAuthenticated).toBe(false);
		});

		it('persists cleared auth to localStorage', () => {
			user.setAuth({ uid: 'u1', email: 'a@b.com', photoURL: null, token: 'tok' });
			user.logout();
			const stored = JSON.parse(localStorage.getItem('wollama_user')!);
			expect(stored.uid).toBeNull();
		});

		it('preserves nickname and preferences after logout', () => {
			user.nickname = 'Bob';
			user.preferences.theme = 'dark';
			user.logout();
			expect(user.nickname).toBe('Bob');
			expect(user.preferences.theme).toBe('dark');
		});
	});

	// ── save ───────────────────────────────────────────────────────────────────

	describe('save', () => {
		it('writes all expected keys to localStorage', () => {
			user.nickname = 'Charlie';
			user.save();
			const stored = JSON.parse(localStorage.getItem('wollama_user')!);
			expect(stored).toHaveProperty('nickname', 'Charlie');
			expect(stored).toHaveProperty('preferences');
			expect(stored).toHaveProperty('uid');
			expect(stored).toHaveProperty('email');
			expect(stored).toHaveProperty('photoURL');
			expect(stored).toHaveProperty('password');
		});

		it('sets isConfigured to true', () => {
			expect(user.isConfigured).toBe(false);
			user.save();
			expect(user.isConfigured).toBe(true);
		});
	});

	// ── reset ──────────────────────────────────────────────────────────────────

	describe('reset', () => {
		it('clears all state', () => {
			user.setAuth({ uid: 'u1', email: 'a@b.com', photoURL: null, token: 'tok' });
			user.setLocalProtection('pass');
			user.nickname = 'Dave';
			user.reset();

			expect(user.nickname).toBe('');
			expect(user.isConfigured).toBe(false);
			expect(user.isAuthenticated).toBe(false);
			expect(user.uid).toBeNull();
			expect(user.email).toBeNull();
			expect(user.token).toBeNull();
			expect(user.password).toBeNull();
			expect(user.isSecured).toBe(false);
		});

		it('restores default preferences', () => {
			user.preferences.theme = 'dark';
			user.preferences.locale = 'fr';
			user.reset();
			expect(user.preferences.theme).toBe('fluent-light');
			expect(user.preferences.locale).toBe('en');
		});

		it('removes entry from localStorage', () => {
			user.save();
			expect(localStorage.getItem('wollama_user')).not.toBeNull();
			user.reset();
			expect(localStorage.getItem('wollama_user')).toBeNull();
		});
	});
});
