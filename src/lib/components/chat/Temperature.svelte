

    <script lang="ts">
	import { settings } from "$lib/stores/settings";

    
    </script>

..<div class="flex-align-middle gap-8   ">

    {#each Object.keys($settings?.temperatures ?? {}) as temperature}        
         <buttono class="h-10 border">{temperature}</buttono>
    {/each}
</div>