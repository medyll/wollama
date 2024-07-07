<script lang="ts" generics="T = Record<string, any>">
    import { Button, openWindow, type Props } from '@medyll/slot-ui';
    import CreateUpdate from '$components/form/CreateUpdate.svelte';
    import { idbqlState } from '$lib/db/dbSchema';
    import CrudCollectionList from './CollectionListMenu.svelte';

    interface Props {
        collection: string;
        data?: Record<string, any>;
        style?: ElementCSSInlineStyle;
    }

    let { collection, style }: Props = $props();

    let qy = idbqlState[collection].getAll();
</script>

<div style="max-height:100%;height:350px;min-width:750px; {style}" class="flex border">
    <div class="w-48 border">
        <CrudCollectionList {collection} target="red" />
    </div>
    <div data-target-zone="red">ss</div>
</div>
