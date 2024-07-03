<script lang="ts">
    import { Button, MenuList, MenuListItem, openWindow, type Props } from '@medyll/slot-ui';
    import CreateUpdate from '$components/form/CreateUpdate.svelte';
    import { idbqlState } from '$lib/db/dbSchema';
    import { IDbFields, iDBFieldValues } from '$lib/db/dbFields';
    import { mount,hydrate } from 'svelte';

    interface Props {
        collection: string;
        target?:string; // html target
        data?: Record<string, any>;
    }

    let { collection, target, data }: Props = $props();

    let test = new IDbFields();
    let fieldValues = new iDBFieldValues(collection);
    let index = test.getIndexName(collection);

    let qy = idbqlState[collection].getAll();

    function load(event:CustomEvent,index:number) {
        console.log('load', event);
        openCrud()
    }

    function openCrud() {
        // mount on target, returns component
        let mounted = hydrate(CreateUpdate, {
            target: document.querySelector(`[data-target-zone="${target}"]`),
            props: { collection: collection, dataId:2, mode: 'create' }
        });
        console.log('mounted', document.querySelector(`[data-target-zone="${target}"]`));
        return mounted;
    }

    $inspect(qy);
</script>


    <MenuList onclick={load} data={qy}>
        {#snippet children({item})}            
        <MenuListItem data={item}>{fieldValues.presentation(item)}</MenuListItem>
        {/snippet}
    </MenuList> 
