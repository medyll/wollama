<script lang="ts">
	import { page } from '$app/stores';
	import { idbqlState, schemeModel } from '$lib/db/dbSchema';
	import { Icon, Looper, openWindow, Window } from '@medyll/idae-slotui-svelte';
	import { IDbCollections } from '$lib/db/dbFields';
	import CrudZone from '$components/form/CrudZone.svelte';

	let collection = $page.params.collection;

	let list = idbqlState[collection].getAll();

	let test = new IDbCollections(schemeModel);
	let index = test.getCollection(collection)?.template?.index;
</script>

<CrudZone {collection} style="height:100%;" />
<!-- {#key index}
    {#if index}
        <Looper data={list}>
            {#snippet children({ item })}
                <div class="flex-align-middle gap-4 p1">
                    <div>{test.indexValue(collection, item)}</div>
                    <div>{test.presentation(collection, item)}</div>
                </div>
            {/snippet}
        </Looper>
    {/if}
{/key} -->
