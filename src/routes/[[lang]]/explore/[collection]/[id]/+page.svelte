<script lang="ts">
    import type { PageData } from './$types';
        import { page } from '$app/stores';

       let {data}: PageData= $props()
        $inspect($page);
</script>