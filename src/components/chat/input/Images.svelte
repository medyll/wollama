<script lang="ts">

	import { prompter } from "$lib/stores/prompter";

</script>

{#if $prompter?.images?.length > 0}
<div class="flex justify-center p-2">
    <div class='flex-align-middle px-2 gap-4'  >    
    {#each $prompter.images ?? [] as file, fileIdx}
        <div class="aspect-square border text-center">
            <img src={file.header+','+file.base64} alt="list" style="height:100px" />
            <div>{file.name}</div>
        </div>
    {/each}
    </div>
</div> 
{/if}
