<script lang="ts">
    import { TextField } from '@medyll/idae-slotui-svelte';
import { onMount } from 'svelte';

    let showOpener: boolean = true;

    /* onMount(() => {
		setTimeout(() => {
			showOpener = false;
		}, 500);
	}); */
</script>

{#if showOpener}
    <div class="ss">
        <div class="content-center items-center  ">
		<div><TextField value="value" /></div>
		</div>
    </div>
{/if}

<slot />

<style>
    .ss {
		position:fixed;
        border: 10px solid red;
        left: 0;
        z-index: 3000;
        height: 100%;
        width: 100%;
        align-content: center;
    }
</style>
