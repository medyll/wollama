<script lang="ts">
    import type { PageData } from './$types';
    import { page } from '$app/stores';
    import { idbQuery } from '$lib/db/dbQuery';
    import { idbqlState, schemeModel } from '$lib/db/dbSchema';
    import { Looper } from '@medyll/slot-ui';
    import CreateUpdate from '$lib/form/CreateUpdate.svelte';
    import { dbFields } from '$lib/db/dbFields';

    let collection = $page.params.collection;

    let list = idbqlState[collection].getAll();

    let test = new dbFields(schemeModel);
    let index = test.getCollection(collection)?.template?.index;
</script>

{#if index}
    <Looper data={list}>
        {#snippet children({ item })}
            <CreateUpdate {collection} dataId={item[index]} mode="show" />
        {/snippet}
    </Looper>
{/if}
