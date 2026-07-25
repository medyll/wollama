<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	let password = $state('');
	let error = $state('');

	function handleLogin() {
		if (password === userState.password) {
			userState.isAuthenticated = true;
			goto('/chat/new');
		} else {
			error = 'Invalid password';
		}
	}
</script>

<login-component>
	<section class="card" data-pad="xl" data-radius="lg" data-elevation="lg">
		<login-header>
			<div class="login-avatar" aria-hidden="true">{userState.nickname.charAt(0).toUpperCase()}</div>
			<h1>Welcome back, {userState.nickname}</h1>
			<p class="text-muted">Please enter your password to continue</p>
		</login-header>

		<form class="form-stack" onsubmit={(event) => { event.preventDefault(); handleLogin(); }}>
			<div class="field-stack">
				<label for="password">Password</label>
				<input id="password" type="password" bind:value={password} autocomplete="current-password" />
			</div>

			{#if error}
				<p class="status-message" data-status="critical" role="alert">{error}</p>
			{/if}

			<button class="btn-primary" type="submit">
				Unlock
				<Icon icon="lucide:unlock" />
			</button>
		</form>

		<hr />
		<button
			class="btn-ghost btn-sm"
			onclick={() => {
				if (confirm('Reset all data?')) {
					localStorage.clear();
					location.reload();
				}
			}}
		>
			Forgot password? (Reset App)
		</button>
	</section>
</login-component>

<style>
	login-component,
	login-header {
		display: flex;
	}

	login-component {
		min-height: 100dvh;
		align-items: center;
		justify-content: center;
		padding: var(--pad-md);
		background: var(--color-surface-alt);
	}

	login-component > section {
		width: min(100%, 24rem);
	}

	login-header {
		flex-direction: column;
		align-items: center;
		gap: var(--gap-sm);
		text-align: center;
	}

	login-header h1,
	login-header p {
		margin: 0;
	}

	.login-avatar {
		display: flex;
		width: var(--icon-size-lg);
		height: var(--icon-size-lg);
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: var(--text-xl);
		font-weight: var(--font-bold);
	}
</style>
