<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import { connectionState } from '$lib/state/connection.svelte';
	import { t } from '$lib/state/i18n.svelte';
	import { onMount, onDestroy } from 'svelte';

	let pollingTimer: ReturnType<typeof setInterval> | undefined;
	let tempUrl = $state(userState.preferences.serverUrl);
	let isRestartingBackend = $state(false);
	let isDesktopRuntime = $state(false);

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
				connectionState.showModal = true;

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

	async function restartPackagedBackend() {
		if (!window.wollamaDesktop) return;

		isRestartingBackend = true;
		try {
			const status = await window.wollamaDesktop.restartBackend();
			tempUrl = status.url;
			userState.preferences.serverUrl = status.url;
			userState.save();

			if (status.status === 'running') {
				await checkConnection();
			} else {
				toast.error(status.error || t('status.still_inaccessible'), 5000);
			}
		} finally {
			isRestartingBackend = false;
		}
	}

	onMount(() => {
		isDesktopRuntime = !!window.wollamaDesktop;

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
	<!-- This alert intentionally stays below the sidebar layer so navigation and Settings remain reachable. -->
	<aside class="connection-banner" role="alert" aria-live="assertive" aria-labelledby="connection-banner-title">
		<div class="connection-banner-header">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="text-warning h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/></svg
			>
			<h3 id="connection-banner-title" class="text-lg font-semibold">
				{#if !connectionState.isConnected}
					{t('status.server_inaccessible')}
				{:else}
					Ollama Service Unavailable
				{/if}
			</h3>
		</div>
		<p class="text-sm opacity-80">
			{#if !connectionState.isConnected}
				{t('status.check_server')}
			{:else}
				The backend is connected, but Ollama is not responding. Check the Ollama installation or continue offline.
			{/if}
		</p>

		<div class="form-control w-full">
			<label class="label" for="server-url-input">
				<span class="label-text">{t('settings.server_url')}</span>
			</label>
			<input
				id="server-url-input"
				type="url"
				bind:value={tempUrl}
				class="input input-bordered w-full font-mono"
				placeholder="http://localhost:3000"
			/>
		</div>

		<div class="connection-banner-actions">
			<button class="btn btn-ghost btn-sm" onclick={goOffline}>{t('status.continue_offline')}</button>
			{#if isDesktopRuntime}
				<button class="btn btn-outline btn-sm" onclick={restartPackagedBackend} disabled={isRestartingBackend}>
					{isRestartingBackend ? `${t('status.connecting')}...` : 'Restart local server'}
				</button>
			{/if}
			<button class="btn btn-primary btn-sm" onclick={updateUrl} disabled={connectionState.isChecking}>
				{#if connectionState.isChecking}
					<span class="loading loading-spinner loading-xs"></span>
					{t('status.connecting')}...
				{:else}
					{t('status.retry')}
				{/if}
			</button>
		</div>
	</aside>
{/if}

<style>
	.connection-banner {
		position: fixed;
		right: var(--pad-md);
		bottom: var(--pad-md);
		z-index: var(--z-overlay);
		display: grid;
		width: min(32rem, calc(100vw - (2 * var(--pad-md))));
		gap: var(--gap-md);
		padding: var(--pad-md);
		border: var(--border-width) solid var(--color-warning);
		border-radius: var(--radius-lg);
		background: var(--color-surface-raised);
		box-shadow: var(--shadow-lg);
		color: var(--color-text);
	}

	.connection-banner-header,
	.connection-banner-actions {
		display: flex;
		align-items: center;
		gap: var(--gap-sm);
	}

	.connection-banner-header h3,
	.connection-banner p {
		margin: 0;
	}

	.connection-banner-header svg {
		width: var(--icon-size-md);
		height: var(--icon-size-md);
		flex: none;
		color: var(--color-warning);
	}

	.connection-banner .form-control,
	.connection-banner label {
		display: grid;
		gap: var(--gap-xs);
	}

	.connection-banner input {
		width: 100%;
		padding: var(--pad-sm);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font-family: var(--font-mono);
	}

	.connection-banner-actions {
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.connection-banner-actions button {
		padding: var(--pad-xs) var(--pad-sm);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
	}

	.connection-banner-actions button:last-child {
		border-color: var(--color-primary);
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.connection-banner-actions button:disabled {
		cursor: wait;
		opacity: 0.6;
	}

	@media (width < 48rem) {
		.connection-banner {
			right: var(--pad-sm);
			bottom: var(--pad-sm);
			width: calc(100vw - (2 * var(--pad-sm)));
		}
	}
</style>
