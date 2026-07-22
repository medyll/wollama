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
		class="btn-primary btn-sm"
		onclick={handleSignIn}
		disabled={isSigningIn}
		title={t('ui.signIn')}
		aria-label={t('ui.signIn')}
	>
		{#if isSigningIn}
			<span aria-hidden="true">…</span>
		{:else}
			<Icon icon="fluent:person-arrow-right-24-regular" class="mr-2 h-4 w-4" />
			{t('ui.signIn')}
		{/if}
	</button>
{:else}
	<!-- Section: User Profile -->
	<div class="user-profile">
		{#if userState.photoURL}
			<img src={userState.photoURL} alt="Avatar" class="user-avatar" />
		{:else}
			<div class="user-avatar user-avatar-placeholder">
				{userState.nickname ? userState.nickname[0].toUpperCase() : 'U'}
			</div>
		{/if}
		<div class="hidden max-w-[100px] min-w-0 md:block">
			<p class="truncate text-xs font-bold">{userState.nickname || 'User'}</p>
			<p class="truncate text-[10px] opacity-70">Sync ON</p>
		</div>
	</div>
{/if}

<style>
	.user-profile {
		display: flex;
		align-items: center;
		gap: var(--gap-sm);
		padding: var(--pad-xs) var(--pad-sm);
		border-radius: var(--radius-sm);
		background: var(--color-surface-alt);
	}

	.user-avatar {
		display: flex;
		width: var(--icon-size-md);
		height: var(--icon-size-md);
		flex: none;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		object-fit: cover;
	}

	.user-avatar-placeholder {
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: var(--font-bold);
	}
</style>
