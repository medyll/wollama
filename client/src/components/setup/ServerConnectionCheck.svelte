<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import { connectionState } from '$lib/state/connection.svelte';
	import { t } from '$lib/state/i18n.svelte';
	import { onMount, onDestroy } from 'svelte';

	let pollingTimer: any;
	let tempUrl = $state(userState.preferences.serverUrl);
	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (!dialog) return;
		if (connectionState.showModal && !dialog.open) dialog.showModal();
		if (!connectionState.showModal && dialog.open) dialog.close();
	});

	async function checkConnection(isAuto = false) {
		connectionState.setChecking(true);
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const baseUrl = userState.preferences.serverUrl.replace(/\/$/, '');
			const res = await fetch(`${baseUrl}/api/health`, {
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			if (res.ok) {
				const data = await res.json();

				if (!connectionState.isConnected) {
					toast.success(t('status.connection_restored'));
				} else if (!isAuto) {
					toast.success(t('status.server_connected'));
				}

				connectionState.setConnected(true);

				// Check Ollama status
				const ollamaUp = !!data.ollama;
				if (connectionState.isOllamaConnected && !ollamaUp) {
					toast.warning('Ollama service is down. Chat features unavailable.');
				} else if (!connectionState.isOllamaConnected && ollamaUp && connectionState.isConnected) {
					// Only show restored if we were previously connected but ollama was down
					// Actually, let's just update the state silently or maybe a small toast
				}
				connectionState.setOllamaConnected(ollamaUp);

				connectionState.showModal = false;
			} else {
				throw new Error('Status ' + res.status);
			}
		} catch (e) {
			console.error('Connection check failed:', e);

			if (connectionState.isConnected) {
				// Transition from Connected -> Disconnected
				connectionState.setConnected(false);

				// "in case of fail, the bubble must be red, autoclose off" -> CHANGED TO: "show notification with auto_close"
				toast.error(t('status.server_inaccessible'), 5000);
			} else {
				// Already disconnected
				if (!isAuto) {
					// Manual retry failed
					toast.error(t('status.still_inaccessible'), 3000);
				}
			}
		} finally {
			connectionState.setChecking(false);
		}
	}

	function updateUrl() {
		userState.preferences.serverUrl = tempUrl;
		userState.save();
		checkConnection();
	}

	function goOffline() {
		connectionState.showModal = false;
		toast.info(t('status.offline_mode'));
	}

	onMount(() => {
		// Initial check
		checkConnection(true);

		// Polling every 30s to detect disconnection or retry connection
		pollingTimer = setInterval(() => {
			checkConnection(true);
		}, 30000);
	});

	onDestroy(() => {
		if (pollingTimer) clearInterval(pollingTimer);
	});
</script>

{#if connectionState.showModal}
	<dialog bind:this={dialog} class="connection-dialog" aria-labelledby="modal-title" oncancel={goOffline}>
		<section>
			<h3
				id="modal-title"
				class={`flex items-center gap-2 text-lg font-bold ${!connectionState.isConnected ? 'text-error' : 'text-warning'}`}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/></svg
				>
				{#if !connectionState.isConnected}
					{t('status.server_inaccessible')}
				{:else}
					Ollama Service Unavailable
				{/if}
			</h3>
			<p class="py-4">
				{#if !connectionState.isConnected}
					{t('status.check_server')}
				{:else}
					The backend server is connected, but the Ollama AI engine is not responding. Please check your Ollama
					installation.
				{/if}
			</p>

			<div class="field-stack">
				<label for="server-url-input">{t('settings.server_url')}</label>
				<input
					id="server-url-input"
					type="text"
					bind:value={tempUrl}
					class="font-mono"
					placeholder="http://localhost:3000"
				/>
			</div>

			<div class="toolbar">
				<button class="btn-ghost" onclick={goOffline}>{t('status.continue_offline')}</button>
				<button class="btn-primary" onclick={updateUrl} disabled={connectionState.isChecking}>
					{#if connectionState.isChecking}
						{t('status.connecting')}...
					{:else}
						{t('status.retry')}
					{/if}
				</button>
			</div>
		</section>
	</dialog>
{/if}

<style>
	.connection-dialog {
		width: min(32rem, calc(100vw - (2 * var(--pad-md))));
		max-width: none;
		padding: 0;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface-raised);
		color: var(--color-text);
	}

	.connection-dialog::backdrop {
		background: color-mix(in oklch, var(--color-text) 40%, transparent);
		backdrop-filter: blur(0.25rem);
	}

	.connection-dialog section {
		display: grid;
		gap: var(--gap-md);
		padding: var(--pad-lg);
	}

	.connection-dialog h3,
	.connection-dialog p {
		margin: 0;
	}

	.connection-dialog .toolbar {
		justify-content: flex-end;
	}
</style>
