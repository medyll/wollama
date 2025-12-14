<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { userState } from '$lib/state/user.svelte';
	import { connectionState } from '$lib/state/connection.svelte';
	import { t } from '$lib/state/i18n.svelte';

	let isVisible = $state(true);
	let dialog = $state<HTMLDialogElement>();

	onMount(async () => {
		dialog?.showModal();

		// Minimum delay for visual effect
		const minDelay = new Promise((resolve) => setTimeout(resolve, 2000));

		const checkServer = async () => {
			try {
				const baseUrl = userState.preferences.serverUrl.replace(/\/$/, '');
				const res = await fetch(`${baseUrl}/api/health`);
				return res.ok;
			} catch (e) {
				console.error('Splash screen connection check failed:', e);
				return false;
			}
		};

		// Run check and delay in parallel
		const [_, isUp] = await Promise.all([minDelay, checkServer()]);

		connectionState.setConnected(isUp);

		// Navigation logic
		if (!userState.isConfigured) {
			goto('/setup');
		} else if (userState.isSecured && !userState.isAuthenticated) {
			goto('/login');
		} else if ($page.url.pathname === '/') {
			goto('/chat');
		}

		// Hide splash screen
		dialog?.close();
		isVisible = false;
	});
</script>

{#if isVisible}
	<dialog
		class="modal backdrop:bg-base-300/50 backdrop:backdrop-blur-sm"
		bind:this={dialog}
		oncancel={(e) => e.preventDefault()}
		aria-labelledby="splash-title"
	>
		<div class="modal-box bg-base-100 relative w-full max-w-md overflow-hidden p-0 shadow-2xl">
			<!-- Section: Background Image Container -->
			<div
				class="absolute inset-0 z-0"
				style="background-image: url('/assets/lama.png'); background-size: cover; background-position: center;"
			>
				<div class="bg-base-100/90 absolute inset-0"></div>
			</div>

			<!-- Section: Content -->
			<div class="relative z-10 flex flex-col items-center p-10 text-center">
				<h1 id="splash-title" class="text-primary mb-2 text-4xl font-bold">Wollama</h1>
				<p class="py-6 text-lg font-medium opacity-70">{t('ui.loading_assistant')}</p>
				<span class="loading loading-dots loading-lg text-primary"></span>
			</div>
		</div>
	</dialog>
{/if}
