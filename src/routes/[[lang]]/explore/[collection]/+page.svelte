<script lang="ts"> 
    import { page } from '$app/stores'; 
    import { idbqlState, schemeModel } from '$lib/db/dbSchema';
    import { Icon, Looper, openWindow, Window } from '@medyll/slot-ui'; 
    import { IDbFields } from '$lib/db/dbFields';

    let collection = $page.params.collection;

    let list = idbqlState[collection].getAll();

    let test = new IDbFields(schemeModel);
    let index = test.getCollection(collection)?.template?.index;


</script>

 
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
