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
		if (!userState.preferences.onboarding_completed) {
			goto('/onboarding');
		} else if (userState.isSecured && !userState.isAuthenticated) {
			goto('/login');
		} else if ($page.url.pathname === '/') {
			goto('/chat/new');
		}

		// Hide splash screen
		dialog?.close();
		isVisible = false;
	});
</script>

{#if isVisible}
	<dialog
		class="splash-dialog"
		bind:this={dialog}
		oncancel={(e) => e.preventDefault()}
		aria-labelledby="splash-title"
	>
		<section>
			<img src="/assets/lama.png" alt="" />
			<h1 id="splash-title">Wollama</h1>
			<p>{t('ui.loading_assistant')}</p>
			<progress aria-label={t('ui.loading_assistant')}></progress>
		</section>
	</dialog>
{/if}

<style>
	.splash-dialog {
		width: min(28rem, calc(100vw - (2 * var(--pad-md))));
		max-width: none;
		padding: 0;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface-raised);
		color: var(--color-text);
	}

	.splash-dialog::backdrop {
		background: color-mix(in oklch, var(--color-surface-alt) 70%, transparent);
		backdrop-filter: blur(0.25rem);
	}

	.splash-dialog section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--gap-md);
		padding: var(--pad-xl);
		text-align: center;
	}

	.splash-dialog img {
		width: 6rem;
		height: 6rem;
		object-fit: contain;
	}

	.splash-dialog h1,
	.splash-dialog p {
		margin: 0;
	}

	.splash-dialog h1 {
		color: var(--color-primary);
	}
</style>
