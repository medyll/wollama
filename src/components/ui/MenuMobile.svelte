<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte';
	import Sidebar from './Sidebar.svelte';
	import { engine } from '$lib/tools/engine';
</script>

<div class="lg:hidden flex shadow lg:w-full theme-bg-dark">
	<div class="flex-v gap-4 px-4 py-2 theme-bg-dark">
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
	<div class="lg:hidden fixed right-0 left-14 flex-1 theme-bg z-300 h-full shadow">
		<div class="  mr-2 theme-bg h-full"><Sidebar /></div>
	</div>
{/if}
