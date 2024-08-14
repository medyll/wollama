<!-- 
    Component CollectionReverseFks.svelte :  to display a list of reverse foreign keys for a specific collection.
    D:\boulot\python\wollama\src\components\form\CollectionReverseFks.svelte

    (alias) type Tpl<T = TplCollectionFields> = {
    index: string;
    presentation: string | number | symbol;
    fields: { [K in keyof T]: TplFieldRules; };
    fks: { [K in TplCollectionName]?: {
        code: K;
        multiple: boolean;
        rules: CombinedArgs;
    }; };
    } 
 -->
<script lang="ts">
    import { IDbCollections } from '$lib/db/dbFields';
    import { schemeModel, idbqlState } from '$lib/db/dbSchema';
    import type { Tpl, TplCollectionName, Where } from '@medyll/idae-idbql';
    import { Looper } from '@medyll/idae-slotui-svelte';
    import type { Snippet, SvelteComponent } from 'svelte';

    type CollectionFksProps = {
        collection: TplCollectionName;
        collectionId?: any;
        where?: Where;
        children: Snippet<[{ collection: string; template: Tpl }]>;
        showTitle?: boolean | string;
        component?: typeof SvelteComponent;
        componentProps?: Record<string, any>;
    };
    let { collection, children: child, showTitle = false, component, componentProps = {} }: CollectionFksProps = $props();
    const dbFields = new IDbCollections(schemeModel);
    const fks = $derived(dbFields.reverseFks(collection));

    function getTitle() {
        if (typeof showTitle === 'string') return showTitle;
        return showTitle ? `Related ${collection}` : '';
    }
</script>

<Looper data={Object.entries(fks)}>
    {#snippet children({ item })}
        {#if showTitle}
            <div class="p2 font-bold">{item?.[0]}</div>
        {/if}
        {#if component}
            <svelte:component this={component} collection={item[0]} template={item[1]} {...componentProps} />
        {:else}
            {@render child({
                collection: item[0],
                template: item[1],
            })}
        {/if}
    {/snippet}
</Looper>
