<script lang="ts">
    import type { LayoutData } from './$types';
    import { page } from '$app/stores';
    import PageTitle from '$components/ui/PageTitle.svelte';
 
</script>
<PageTitle icon="ep:files" title="ui.explore" addTitle={$page.params.collection ?? '' + $page.params.id ?? ''} />
<div class="h-full w-full settings p-4 px-8">
<slot />
</div>