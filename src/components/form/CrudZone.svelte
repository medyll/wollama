<script lang="ts" generics="T = Record<string, any>">
    import { Button, openWindow, type Props } from '@medyll/slot-ui';
    import CreateUpdate from '$components/form/CreateUpdate.svelte';
    import { idbqlState } from '$lib/db/dbSchema';
    import CrudCollectionList from './CrudCollectionList.svelte';

    interface Props {
        collection: string;
        data?: Record<string, any>;
    }

    let { collection }: Props = $props();

    let qy = idbqlState[collection].getAll();
</script>
 
<div style="max-height:100%;height:350px;" class="flex border">
    <CrudCollectionList {collection}  target="red" />
    <div data-target-zone="red">cdscdscdscds</div>
</div>
