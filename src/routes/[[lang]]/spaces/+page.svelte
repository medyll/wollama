<script lang="ts">
  import { openWindow, Button } from '@medyll/idae-slotui-svelte';
    import type { PageData } from './$types';
    import CreateUpdate from '$components/form/CreateUpdate.svelte';
    
    export let data: PageData;

        function openCrud(collection: string) {
        openWindow(`create-${collection}`, {
            component: CreateUpdate,
            componentProps: { collection: collection, mode: 'create' },
            hideCloseButton: false,
        });
    }

</script>


<Button onclick={() => openCrud('space')} width="auto" icon="ep:files" value="ui.create-new" />