<script lang="ts">
	import { Button, openWindow } from '@medyll/idae-slotui-svelte';
	import type { LayoutData } from './$types';
	import CreateUpdate from '$components/form/CreateUpdate.svelte';
	import { page } from '$app/stores';

	export let data: LayoutData;

	function openCrud(collection: string) {
		openWindow(`create-${collection}`, {
			component:       CreateUpdate,
			componentProps:  { collection: collection, mode: 'create' },
			hideCloseButton: false
		});
	}
</script>

<div>
	<Button
		onclick={() => openCrud($page.params.collection)}
		width="auto"
		icon="ep:files"
		value="ui.explore"
	/>
</div>
<hr />
<slot />
