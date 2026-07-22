<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	function createNewChat() {
		goto('/chat/new');
	}

	onMount(() => {
		goto('/chat/new', { replaceState: true });
	});
</script>

<chat-landing-component>
	<section>
		<img src="/assets/lama.png" alt="Wollama" />
		<h1>{t('ui.ready_to_chat')}</h1>
		<p>{t('ui.select_chat_help')}</p>
		<button class="btn-primary" onclick={createNewChat}>{t('ui.newChat')}</button>
	</section>
</chat-landing-component>
