<script lang="ts">
	import { IDbCollections } from '$lib/db/dbFields';
	import { schemeModel, idbqlState } from '$lib/db/dbSchema';
	import type { TplCollectionName, Where } from '@medyll/idae-idbql';
	import { Looper } from '@medyll/idae-slotui-svelte';

	type CollectionFksProps = {
		collection:    TplCollectionName;
		collectionId?: any;
		where?:        Where;
	};
	let { collection }: CollectionFksProps = $props();

	// idbqlState[fkCollection].get(fkId);

	const dbFields = new IDbCollections(schemeModel);
	const fks = $derived(dbFields.fks(collection));
</script>

<Looper data={Object.entries(fks)}>
	{#snippet children({ item })}
		<div>{item[0]}</div>
	{/snippet}
</Looper>
