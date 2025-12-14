import { userState } from './state/user.svelte';
import { getDatabase, enableReplication, disableReplication } from './db';

// Mock Auth Service - In production, replace with Firebase/Supabase/Auth0
export class AuthService {
	async signInWithGoogle() {
		// 1. Perform OAuth flow (Mocked here)
		console.log('Simulating Google Sign In...');

		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Mock User Data
		const mockUser = {
			uid: 'user_' + Math.random().toString(36).substr(2, 9),
			email: 'user@example.com',
			photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
			token: 'mock_jwt_token_' + Date.now()
		};

		// 2. Update State
		userState.setAuth(mockUser);

		// 3. Trigger Database Sync
		// This is the "Merge" strategy:
		// The local DB (which might have anonymous chats) will now start syncing
		// to the remote DB specific to this user.
		await this.startSync();

		return mockUser;
	}

	async signOut() {
		// 1. Stop Sync
		await disableReplication();

		// 2. Clear State
		userState.logout();

		// Optional: Clear local DB if you want "private" sessions,
		// but for "Offline First" we usually keep data.
	}

	async startSync() {
		if (!userState.isAuthenticated || !userState.uid) return;

		const db = await getDatabase();

		// Enable replication to: http://server/_db/user_{uid}_{collection}
		// We pass the user credentials to the replication manager
		await enableReplication(userState.uid, userState.token || '');
	}
}

export const authService = new AuthService();
