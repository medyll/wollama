<script lang="ts">
	import MainChat from '$components/chat/MainChat.svelte';
	import type { PageData } from './$types';

    import { page } from '$app/stores';
	export let data: PageData;
</script>

<MainChat activeChatId={$page.params.id} />
