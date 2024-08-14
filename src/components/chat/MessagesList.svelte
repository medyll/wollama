<script lang="ts">
    import {  idbQuery } from '$lib/db/dbQuery';
    import Message from './Message.svelte';
    import { Looper } from '@medyll/idae-slotui-svelte';

    let { chatId }:{chatId: string} = $props();

    let chat = $derived(chatId ? idbQuery.getChat(chatId) : []);
    let messages = $derived(chatId ? idbQuery.getMessages(chatId) : []);
    let element: HTMLElement;

    $effect.pre(() => {
        messages;
        if (element) {
            element?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
        }
    });

</script>
<!-- corecteur orthographique -->
{chat?.tags}
<div class="flex flex-col w-full gap-4 flex-1">
    <Looper data={messages ?? []}>
        {#snippet children({ item })}
            <Message messageId={item.messageId} />
        {/snippet}
    </Looper>
</div>
<div class="p-4" bind:this={element}></div>
