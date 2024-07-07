<!-- 
    Component CollectionReverseFks.svelte :  to display a list of reverse foreign keys for a specific collection.
    D:\boulot\python\wollama\src\components\form\CollectionReverseFks.svelte
 -->
 <script lang="ts">

    import { IDbFields } from '$lib/db/dbFields';
    import { schemeModel, idbqlState } from '$lib/db/dbSchema';
    import type { Tpl, TplCollectionName, Where } from '@medyll/idbql';
    import { Looper } from '@medyll/slot-ui';
    import type { Snippet } from 'svelte';

    type CollectionFksProps = {
        collection: TplCollectionName;
        collectionId?: any;
        where?: Where;
        children: Snippet<[{ collection: string; template: Tpl }]>;
    };
    let { collection, children: child }: CollectionFksProps = $props();
    const dbFields = new IDbFields(schemeModel);
    const fks = $derived(dbFields.reverseFks(collection));
</script>

<Looper data={Object.entries(fks)}>
    {#snippet children({ item })}
        {@render child({  
           collection: item[0], 
            template: item[1]  
        })}
    {/snippet}
</Looper>
