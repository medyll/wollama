<script lang="ts">
    import { dbFields } from '$lib/db/dbFields';
    import { schemeModel } from '$lib/db/dbSchema';
    import { Looper } from '@medyll/slot-ui';
    import type { PageData } from './$types';
    import PageTitle from '$components/ui/PageTitle.svelte';

    export let data: PageData;

    let test = new dbFields(schemeModel);

    let val3 = test.parseAllCollections();
    console.log(val3);
</script>


<Looper data={Object.entries(val3)}>
    {#snippet children({item})}
        <div><a href={`/explore/${item[0]}`}>{item[0]}</a></div>        
    {/snippet}
</Looper>
