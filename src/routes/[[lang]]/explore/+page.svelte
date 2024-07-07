<script lang="ts">
    import { IDbCollections } from '$lib/db/dbFields';
    import { schemeModel } from '$lib/db/dbSchema';
    import { Looper } from '@medyll/slot-ui';
    import type { PageData } from './$types';
    import PageTitle from '$components/ui/PageTitle.svelte';
    import CrudZone from '$components/form/CrudZone.svelte';

    export let data: PageData;

    let test = new IDbCollections(schemeModel);

    let val3 = test.parseAllCollections(); 
</script>



<Looper data={Object.entries(val3)}>
    {#snippet children({item})}
        <div><a href={`/explore/${item[0]}`}>{item[0]}</a></div>        
    {/snippet}
</Looper>
