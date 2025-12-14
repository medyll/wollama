<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userState } from '$lib/state/user.svelte';

	// This page is a redirector.
	// The SplashScreen component in +layout.svelte handles the initial loading.
	// This onMount handles client-side navigation back to root.
	onMount(() => {
		if (!userState.isConfigured) {
			goto('/setup');
		} else if (userState.isSecured && !userState.isAuthenticated) {
			goto('/login');
		} else {
			goto('/chat');
		}
	});
</script>

<svelte:head>
	<title>Wollama</title>
</svelte:head>

<!-- Section: Root Placeholder -->
