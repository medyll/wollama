<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { App } from '@capacitor/app';
    import ToastContainer from '$components/ui/ToastContainer.svelte';
    import ServerConnectionCheck from '$components/setup/ServerConnectionCheck.svelte';

	let { children } = $props();

	onMount(() => {
		App.addListener('appUrlOpen', (data) => {
			// Nettoyage: "myapp://chat/123" -> "/chat/123"
			// Adjust logic based on actual scheme
			const slug = data.url.split('.com').pop();
			if (slug) goto(slug);
		});
	});
</script>

<ToastContainer />
<ServerConnectionCheck />
{@render children()}
