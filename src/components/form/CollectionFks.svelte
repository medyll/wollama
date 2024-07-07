<script lang="ts">
    import { IDbFields } from '$lib/db/dbFields';
    import { schemeModel, idbqlState } from '$lib/db/dbSchema';
    import type { TplCollectionName, Where } from '@medyll/idbql';
    import { Looper } from '@medyll/slot-ui';

    type CollectionFksProps = {
        collection: TplCollectionName;
        collectionId?: any;
        where?: Where;
    };
    let { collection }: CollectionFksProps = $props();

    // idbqlState[fkCollection].get(fkId);

    const dbFields = new IDbFields(schemeModel);
    const fks = $derived(dbFields.fks(collection));
</script>

<Looper data={Object.entries(fks)}>
    {#snippet children({ item })}
        <div>{item[0]}</div>
    {/snippet}
</Looper>
