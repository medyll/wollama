<script lang="ts">
    import type { PageData } from './$types';
    import { page } from '$app/stores';
    import { idbQuery } from '$lib/db/dbQuery';
    import { idbqlState, schemeModel } from '$lib/db/dbSchema';
    import { Looper,Window } from '@medyll/slot-ui';
    import CreateUpdate from '$lib/form/CreateUpdate.svelte';
    import { IDbFields } from '$lib/db/dbFields';

    let collection = $page.params.collection;

    let list = idbqlState[collection].getAll();

    let test = new IDbFields(schemeModel);
    let index = test.getCollection(collection)?.template?.index;
</script>


<Window    >jihu</Window>
{#if index}
    <Looper data={list}>
        {#snippet children({ item })}
            <div class="flex-align-middle gap-4 p1">
                <div>{test.indexValue(collection, item)}</div>
                <div>{test.presentation(collection, item)}</div>
            </div>
            <!-- <CreateUpdate {collection} dataId={item[index]} mode="show" /> -->
        {/snippet}
    </Looper>
{/if}
