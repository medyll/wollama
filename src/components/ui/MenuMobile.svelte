<script lang="ts">
	import { goto } from '$app/navigation';
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte';
	import Sidebar from './Sidebar.svelte';
</script>

<div class="md:hidden flex shadow md:w-full theme-bg-dark">
	<div class="flex-v gap-4 px-4 py-4 theme-bg-dark">
		<button
			on:click={async () => ui.showHideMenu()}
			class="  iconButton"
		>
			<Icon icon="mdi:menu-{$ui.showMenu? 'open':'close'}" class="md" />
		</button>
		<hr />
		<button
			on:click={async () => {
				ui.showHideMenu(false);
				ui.setActiveChatId();
				goto('/');
			}}
			class="  iconButton"
		>
			<Icon icon="mdi:chat-plus-outline" class="md" />
		</button>
	</div>
</div>
{#if $ui.showMenu}
	<div class="md:hidden fixed right-0 left-14 flex-1 theme-bg z-50 h-full shadow">
		<div class="  mr-2 theme-bg h-full"><Sidebar /></div>
	</div>
{/if}
