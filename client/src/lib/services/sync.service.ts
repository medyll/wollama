import { connectionState } from '$lib/state/connection.svelte';
import { toast } from '$lib/state/notifications.svelte';
import { t } from '$lib/state/i18n.svelte';
import { getDatabase } from '$lib/db';

export interface SyncQueueItem {
	id: string;
	operation: 'create' | 'update' | 'delete';
	collection: string;
	data: any;
	timestamp: number;
	status: 'pending' | 'sent' | 'error';
	retries: number;
	error?: string;
}

export class SyncService {
	private syncQueue: Map<string, SyncQueueItem> = new Map();
	private isSyncing = false;
	private syncInterval: NodeJS.Timeout | null = null;
	private networkListener: ((online: boolean) => void) | null = null;

	constructor() {
		this.initNetworkListener();
		this.startPeriodicSync();
	}

	/**
	 * Story 4.1: Monitor network connectivity and update sync state
	 */
	private initNetworkListener() {
		if (typeof window === 'undefined') return;

		this.networkListener = (isOnline: boolean) => {
			console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
			connectionState.setConnected(isOnline);

			if (isOnline) {
				// Trigger immediate sync when reconnecting
				this.syncPending().catch(console.error);
			}
		};

		// Browser online/offline events
		window.addEventListener('online', () => this.networkListener?.(true));
		window.addEventListener('offline', () => this.networkListener?.(false));

		// Initial check
		connectionState.setConnected(navigator.onLine);
	}

	/**
	 * Story 4.1: Add message or data change to sync queue
	 */
	addToQueue(collection: string, operation: 'create' | 'update' | 'delete', data: any): string {
		const id = crypto.randomUUID();
		const queueItem: SyncQueueItem = {
			id,
			operation,
			collection,
			data,
			timestamp: Date.now(),
			status: 'pending',
			retries: 0
		};

		this.syncQueue.set(id, queueItem);
		console.log(`Added to sync queue: ${collection}/${operation}`, queueItem);

		// If we're online, sync immediately
		if (connectionState.isConnected && !this.isSyncing) {
			this.syncPending().catch(console.error);
		}

		return id;
	}

	/**
	 * Story 4.1: Process all pending sync queue items
	 */
	async syncPending(): Promise<void> {
		if (this.isSyncing || !connectionState.isConnected) {
			console.log(`Skipping sync: isSyncing=${this.isSyncing}, isConnected=${connectionState.isConnected}`);
			return;
		}

		this.isSyncing = true;
		connectionState.isSyncing = true;

		try {
			const db = await getDatabase();
			let successCount = 0;
			let errorCount = 0;

			for (const [queueId, item] of this.syncQueue.entries()) {
				if (item.status === 'sent') continue; // Already sent

				try {
					const collection = db[item.collection as keyof typeof db];
					if (!collection) {
						throw new Error(`Collection ${item.collection} not found`);
					}

					// Perform the operation
					switch (item.operation) {
						case 'create':
							await collection.insert(item.data);
							break;
						case 'update': {
							const doc = await collection.findOne(item.data.id || item.data._id).exec();
							if (doc) {
								await doc.patch(item.data);
							}
							break;
						}
						case 'delete':
							await collection.findOne(item.data.id || item.data._id).remove();
							break;
					}

					item.status = 'sent';
					successCount++;
					this.syncQueue.delete(queueId);
					console.log(`Synced: ${item.collection}/${item.operation}`, item.data);
				} catch (error) {
					item.retries++;
					if (item.retries > 3) {
						item.status = 'error';
						item.error = String(error);
						errorCount++;
						console.error(`Failed to sync after 3 retries:`, item, error);
					} else {
						console.warn(`Sync error (retry ${item.retries}):`, error);
					}
				}
			}

			if (successCount > 0) {
				console.log(`Sync completed: ${successCount} items synced`);
			}

			if (errorCount > 0) {
				console.error(`Sync had ${errorCount} permanent errors`);
				toast.error(t('sync.errors_persisted') || `${errorCount} items failed to sync`);
			}
		} catch (error) {
			console.error('Fatal sync error:', error);
			toast.error(t('sync.error') || 'Sync failed');
		} finally {
			this.isSyncing = false;
			connectionState.isSyncing = false;
		}
	}

	/**
	 * Story 4.1: Periodic sync check (every 30 seconds)
	 */
	private startPeriodicSync() {
		if (typeof window === 'undefined') return;

		this.syncInterval = window.setInterval(() => {
			if (connectionState.isConnected && !this.isSyncing && this.syncQueue.size > 0) {
				this.syncPending().catch(console.error);
			}
		}, 30000); // 30 seconds
	}

	/**
	 * Get all pending sync items
	 */
	getPendingItems(): SyncQueueItem[] {
		return Array.from(this.syncQueue.values()).filter((item) => item.status !== 'sent');
	}

	/**
	 * Get queue size
	 */
	getQueueSize(): number {
		return this.syncQueue.size;
	}

	/**
	 * Clear sync queue (for testing/cleanup)
	 */
	clearQueue(): void {
		this.syncQueue.clear();
		console.log('Sync queue cleared');
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
		}
		if (this.networkListener && typeof window !== 'undefined') {
			window.removeEventListener('online', () => this.networkListener?.(true));
			window.removeEventListener('offline', () => this.networkListener?.(false));
		}
	}
}

// Singleton instance
export const syncService = new SyncService();
