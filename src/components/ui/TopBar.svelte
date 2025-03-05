<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import StatusBar from '../settings/StatusBar.svelte';
	import { ui } from '$lib/stores/ui';
	import { engine } from '$lib/tools/engine';
	import { idbQuery } from '$lib/db/dbQuery';
	import { page } from '$app/stores';

	// import { getCurrent } from '@tauri-apps/api/window';

	new Date().getSeconds();

	$: chat = idbQuery.getChat($ui.activeChatId);

	$: showConfigClose = $page.route.id?.includes('/configuration');

	const openCloseConfig = async () => {
		if ($page.route.id?.includes('/configuration')) {
			ui.setActiveChatId();
			engine.goto('/');
		} else {
			engine.goto('/configuration');
		}
	};
</script>

<div data-tauri-drag-region class="titlebar application-topBar">
	<full />
	<div class="soft-title truncate text-center" style="max-width:420px">
		{#await chat then value}
			{value?.title ?? ''}
		{/await}
	</div>
	<full />
	<StatusBar />
	{#if typeof window?.__TAURI__ !== 'undefined'}
		<!-- <button
            on:click={() => {
                getCurrent().minimize();
            }}
            class="titlebar-button"
            id="titlebar-minimize">
            <Icon icon="fluent-mdl2:chrome-minimize" alt="minimize" />
        </button>
        <button
            on:click={() => {
                getCurrent().toggleMaximize();
            }}
            class="titlebar-button"
            id="titlebar-maximize">
            <Icon icon="fluent-mdl2:chrome-restore" alt="restore" />
        </button>
        <button
            on:click={() => {
                getCurrent().close();
            }}
            class="titlebar-button titlebar-button-close"
            id="titlebar-close">
            <Icon icon="fluent-mdl2:chrome-close" alt="close" />
        </button> -->
	{/if}
</div>

<style lang="postcss">
	@reference "../../styles/references.css";
	.titlebar {
		user-select: none;
		display: flex;
		justify-content: flex-end;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9000;
		gap: 0;
		position: relative;

		:global(svg) {
			color: rgb(139, 148, 158);
		}
	}
</style>
