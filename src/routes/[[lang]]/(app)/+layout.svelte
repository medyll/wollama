<script lang="ts">
	import MainChat from '$components/chat/MainChat.svelte';
	import Sidebar from '$components/ui/Sidebar.svelte';
	import TopBar from '$components/ui/TopBar.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<slot><MainChat /></slot>
