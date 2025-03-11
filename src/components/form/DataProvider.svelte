<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte'; 

	interface PROPS {
		collection: string;
		data:       Record<string, any>[];
		children:   Snippet;
	}

	let { collection, children, data = $bindable() }: PROPS = $props();
	let _data = $derived(data);

	setContext('collection', collection);
 
	setContext('data', data);
	$inspect('data.provider', _data); // Corrected to reference others.data directly
</script>

{@render children?.()}
