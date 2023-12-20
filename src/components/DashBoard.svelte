<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte';

	let className='';

	export { className as class };
</script>

 
{#if !$ui.activeChatId}
	<div class="h-full w-full flex flex-col">
		<div class="flex-1"></div>
		<div class="flex self-center text-center">
			<Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" />
		</div>
		<div class="flex-1"></div>
	</div>
{:else}
	<slot />
{/if}