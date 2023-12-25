<script lang="ts">
	import MainChat from '$components/chat/MainChat.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<slot><MainChat /></slot>
