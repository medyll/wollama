<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
	import { userState } from '$lib/state/user.svelte';
	import { authService } from '$lib/auth';
	import Icon from '@iconify/svelte';

	let isSigningIn = $state(false);

	async function handleSignIn() {
		isSigningIn = true;
		try {
			await authService.signInWithGoogle();
		} catch (e) {
			console.error(e);
		} finally {
			isSigningIn = false;
		}
	}
</script>

{#if !userState.isAuthenticated}
	<button
		class="btn btn-primary btn-sm"
		onclick={handleSignIn}
		disabled={isSigningIn}
		title={t('ui.signIn')}
	>
		{#if isSigningIn}
			<span class="loading loading-spinner loading-xs"></span>
		{:else}
			<Icon icon="lucide:log-in" class="h-4 w-4 mr-2" />
			{t('ui.signIn')}
		{/if}
	</button>
{:else}
	<div class="flex items-center gap-2 bg-base-200 rounded-lg px-2 py-1">
		{#if userState.photoURL}
			<img src={userState.photoURL} alt="Avatar" class="h-8 w-8 rounded-full" />
		{:else}
			<div
				class="bg-primary text-primary-content flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold"
			>
				{userState.nickname ? userState.nickname[0].toUpperCase() : 'U'}
			</div>
		{/if}
		<div class="hidden md:block min-w-0 max-w-[100px]">
			<p class="truncate text-xs font-bold">{userState.nickname || 'User'}</p>
			<p class="truncate text-[10px] opacity-70">Sync ON</p>
		</div>
	</div>
{/if}
