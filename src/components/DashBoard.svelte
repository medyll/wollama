<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte';
</script>

{#if !$ui.activeChatId}
	<div class="h-full w-full flex-col border">
		<div></div>
		<div class="flex justify-self-end">
			<Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" />
		</div>
		<div></div>
	</div>
{:else}
	<slot />
{/if}
