<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte';
	import Model from './chat/input/Model.svelte';
	import { t } from '$lib/stores/i18n';

	let className = '';

	export { className as class };
</script>

{#if !$ui.activeChatId}
	<div class="h-full w-full flex flex-col">
		<div class="flex-1"></div>
		<div class="flex self-center text-center opacity-70">
			<Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" />
		</div>
		<div class="flex-col self-center text-center p-4">
			<div class="soft-title">{$t('ui.use_model')}</div>
			<Model />
		</div>
		<div class="flex-1"></div>
	</div>
{:else}
	<slot />
{/if}
