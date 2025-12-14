<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import { t } from '$lib/state/i18n.svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	let password = $state('');
	let error = $state('');

	function handleLogin() {
		if (password === userState.password) {
			userState.isAuthenticated = true; // Simple session flag
			goto('/chat');
		} else {
			error = 'Invalid password';
		}
	}
</script>

<div class="bg-base-200 flex min-h-screen items-center justify-center p-4">
	<!-- Section: Login Card -->
	<div class="card bg-base-100 w-full max-w-sm shadow-xl">
		<div class="card-body items-center text-center">
			<div class="avatar placeholder mb-4">
				<div class="bg-neutral text-neutral-content w-24 rounded-full">
					<span class="text-3xl">{userState.nickname.charAt(0).toUpperCase()}</span>
				</div>
			</div>

			<h2 class="card-title mb-1 text-2xl">Welcome back, {userState.nickname}</h2>
			<p class="text-base-content/70 mb-6">Please enter your password to continue</p>

			<div class="form-control w-full">
				<input
					type="password"
					placeholder="Password"
					aria-label="Password"
					class="input input-bordered w-full text-center"
					bind:value={password}
					onkeydown={(e) => e.key === 'Enter' && handleLogin()}
				/>
			</div>

			{#if error}
				<div class="text-error mt-2 text-sm">{error}</div>
			{/if}

			<button class="btn btn-primary mt-6 w-full" onclick={handleLogin} aria-label="Unlock">
				Unlock
				<Icon icon="lucide:unlock" class="ml-2 h-4 w-4" />
			</button>

			<div class="divider my-4"></div>

			<button
				class="btn btn-ghost btn-sm text-xs"
				onclick={() => {
					// Reset logic could go here
					if (confirm('Reset all data?')) {
						localStorage.clear();
						location.reload();
					}
				}}
				aria-label="Reset App"
			>
				Forgot password? (Reset App)
			</button>
		</div>
	</div>
</div>
