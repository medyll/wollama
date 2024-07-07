<!-- 
    Component button to open a CreateUpdateShow window for a specific collection.    
    D:\boulot\python\wollama\src\components\form\CollectionButton.svelte
 -->
<script lang="ts" generics="COL">
    import { Button,  openWindow } from '@medyll/slot-ui';
    import CreateUpdate from '$components/form/CreateUpdate.svelte';
    import { type CreateUpdateProps } from './types';

    type CollectionButtonProps = {
        collection: string;
        withData?: Record<string, any>;
    } & CreateUpdateProps;

    let { collection = 'book', withData, ...rest }: CollectionButtonProps = $props();

    function openCrud(collection: string) {
        openWindow(`create-${collection}`, {
            component: CreateUpdate,
            componentProps: { collection: collection,  withData, ...rest },
            hideCloseButton: false,
        });
    }
</script>

<Button onclick={() => openCrud(collection)} width="auto" icon="mdi:add" value="ui.{rest.mode}-{collection}" />
