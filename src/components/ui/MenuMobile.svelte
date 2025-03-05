<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import Sidebar from './Sidebar.svelte';
	import { engine } from '$lib/tools/engine';
</script>

<div class="theme-bg-dark flex shadow-sm lg:hidden lg:w-full">
	<div class="flex-v theme-bg-dark gap-4 px-4 py-2">
		<button on:click={async () => ui.showHideMenu()} class="aspect-square">
			<Icon icon="mdi:menu-{$ui.showMenu ? 'open' : 'close'}" class="md" />
		</button>
		<hr />
		<button
			on:click={async () => {
				ui.showHideMenu(false);
				ui.setActiveChatId();
				engine.goto('/');
			}}
			class="aspect-square"
		>
			<Icon icon="mdi:chat-plus-outline" class="md" />
		</button>
	</div>
</div>
{#if $ui.showMenu}
	<div class="theme-bg fixed right-0 left-14 z-300 h-full flex-1 shadow-sm lg:hidden">
		<div class="  theme-bg mr-2 h-full"><Sidebar /></div>
	</div>
{/if}
