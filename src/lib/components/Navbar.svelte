<script lang="ts">
	import { goto } from '$app/navigation';
	import { activeChatId } from '$lib/stores/chatList';
	import Icon from '@iconify/svelte';
</script>

<div class="flex justify-middle">
	<button
		on:click={async () => {
			$activeChatId = undefined;
			goto('/');
		}}
		class="flex"
	>
		<Icon icon="mdi:chat-plus" /> Créer un nouveau chat
	</button>

	AIUI
</div>
