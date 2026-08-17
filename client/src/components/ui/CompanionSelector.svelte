<script lang="ts">
	import type { Companion } from '$types/data';
	import { t } from '$lib/state/i18n.svelte';
	import DataGenericList from '$components/ui_data/DataGenericList.svelte';

	let { isOpen = $bindable(false), onSelect } = $props();
	let dialog: HTMLDialogElement;

	$effect(() => {
		if (!dialog) return;
		if (isOpen && !dialog.open) dialog.showModal();
		if (!isOpen && dialog.open) dialog.close();
	});

	function selectCompagnon(compagnon: Companion) {
		onSelect(compagnon);
		isOpen = false;
	}
</script>

<dialog
	bind:this={dialog}
	class="companion-dialog"
	aria-labelledby="companion-modal-title"
	onclose={() => (isOpen = false)}
	oncancel={() => (isOpen = false)}
>
	<section class="companion-dialog-panel">
		<header class="section-header section-header-bordered">
			<h2 id="companion-modal-title">{t('ui.choose_companion')}</h2>
			<button type="button" class="btn-icon btn-sm" onclick={() => (isOpen = false)} aria-label="Close">✕</button>
		</header>

		<div class="companion-dialog-body">
			<DataGenericList
				tableName="companions"
				displayType="card"
				orderBy="name"
				orderDirection="asc"
				onRowClick={selectCompagnon}
				editable={true}
			/>
		</div>
	</section>
</dialog>

<style>
	.companion-dialog {
		width: min(64rem, calc(100vw - (2 * var(--pad-md))));
		max-width: none;
		height: min(48rem, calc(100dvh - (2 * var(--pad-md))));
		max-height: none;
		padding: 0;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface-raised);
		color: var(--color-text);
		overflow: hidden;
	}

	.companion-dialog::backdrop {
		background: color-mix(in oklch, var(--color-text) 40%, transparent);
		backdrop-filter: blur(0.25rem);
	}

	.companion-dialog-panel {
		display: flex;
		height: 100%;
		min-height: 0;
		flex-direction: column;
	}

	.companion-dialog-panel h2 {
		margin: 0;
	}

	.companion-dialog-body {
		min-height: 0;
		flex: 1;
		padding: var(--pad-md);
		overflow: auto;
	}

	@media (width < 48rem) {
		.companion-dialog {
			width: 100vw;
			height: 100dvh;
			border: 0;
			border-radius: 0;
		}
	}
</style>
