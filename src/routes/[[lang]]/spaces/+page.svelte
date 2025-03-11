<script lang="ts">
	import CollectionButton from '$components/form/CollectionButton.svelte';
	import CollectionList from '$components/form/CollectionList.svelte';
	import { engine } from '$lib/tools/engine';
	import type { DbSpaces } from '$types/db';

	function load(data: DbSpaces) {
		console.log(data);
		engine.goto(`/spaces/${data.id}`);
	}
</script>

<CollectionList collection="space" onclick={load}>
	<CollectionButton collection="space" mode="create" />
</CollectionList>
