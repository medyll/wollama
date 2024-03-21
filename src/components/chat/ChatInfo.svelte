<script lang="ts">
    import { idbQuery } from '$lib/db/dbQuery'; 
    import { ui } from '$lib/stores/ui'; 

    let activeChat = $derived($ui.activeChatId ? idbQuery.getChat($ui.activeChatId) : {});
</script>

{#if activeChat?.createdAt}
    <div class="p-1 py-4">
        <div class="flex-align-middle">
            <div class="opacity-40 flex-1 px-2"></div>
            <slot />
        </div>
    </div>
{/if}
