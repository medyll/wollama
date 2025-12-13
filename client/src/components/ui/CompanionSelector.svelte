<script lang="ts">
	import type { Companion } from '$types/data';
	import { t } from '$lib/state/i18n.svelte';
	import GenericList from '$components/ui_data/GenericList.svelte';

	let { isOpen = $bindable(false), onSelect } = $props();

	function selectCompagnon(compagnon: Companion) {
		onSelect(compagnon);
		isOpen = false;
	}
</script>

<dialog class="modal" class:modal-open={isOpen} aria-labelledby="companion-modal-title">
	<div class="modal-box flex h-[80vh] w-11/12 max-w-5xl flex-col">
		<form method="dialog">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
				onclick={() => (isOpen = false)}
				aria-label="Close">✕</button
			>
		</form>
		<h3 id="companion-modal-title" class="mb-4 flex-none text-lg font-bold">{t('ui.choose_companion')}</h3>

		<div class="flex-1 overflow-y-auto">
			<GenericList
				tableName="companions"
				displayType="card"
				orderBy="name"
				orderDirection="asc"
				onRowClick={selectCompagnon}
				editable={true}
			/>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (isOpen = false)}>close</button>
	</form>
</dialog>
