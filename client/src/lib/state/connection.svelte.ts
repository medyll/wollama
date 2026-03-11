import { enableReplication, disableReplication } from '../db';
import { userState } from './user.svelte';

export class ConnectionState {
	isConnected = $state(true);
	isOllamaConnected = $state(false);
	isChecking = $state(false);
	showModal = $state(false);
	isSyncing = $state(false);

	async setConnected(status: boolean) {
		this.isConnected = status;

		// Wire sync to connection status
		if (status && userState.uid) {
			try {
				this.isSyncing = true;
				await enableReplication(userState.uid, userState.token || '');
				console.log('Replication resumed after reconnection');
			} catch (err) {
				console.error('Failed to resume replication:', err);
			} finally {
				this.isSyncing = false;
			}
		} else {
			// Stop sync on disconnection
			try {
				this.isSyncing = true;
				await disableReplication();
				console.log('Replication paused due to disconnection');
			} catch (err) {
				console.error('Failed to pause replication:', err);
			} finally {
				this.isSyncing = false;
			}
		}
	}

	setOllamaConnected(status: boolean) {
		this.isOllamaConnected = status;
	}

	setChecking(status: boolean) {
		this.isChecking = status;
	}

	toggleModal() {
		this.showModal = !this.showModal;
	}
}

export const connectionState = new ConnectionState();
