<script lang="ts">
    import { Button } from '@medyll/slot-ui';
    import type { LayoutData } from './$types';
    import CreateUpdate from '$lib/form/CreateUpdate.svelte';
    import { page } from '$app/stores';

    export let data: LayoutData;
</script>

<div>
    <Button width="auto" icon="ep:files" value="ui.explore" />
    <CreateUpdate collection={$page.params.collection}  mode="create" />
</div>
<hr />
<slot />
