<script lang="ts">
    import { settings } from '$lib/stores/settings.svelte';
    import Speech from '$components/chat/input/Speech.svelte';
    import Input from './input/Input.svelte';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import ChatOptions from './ChatOptions.svelte';
    import { PromptSender } from '$lib/tools/promptSender.js';
    import { ollamaBodyStore } from '$lib/stores/prompter';
    import { aiState } from '$lib/stores';
    import DashBoard from '$components/DashBoard.svelte';
    import Images from './input/Images.svelte'; 
    import { ChatApiSession } from '$lib/tools/chatApiSession';
    import { chatParamsState, type ChatGenerate } from '$lib/states/chat.svelte';
    import {   Icon,   } from '@medyll/idae-slotui-svelte';
    import MessagesList from './MessagesList.svelte';
    import { chatMetadata } from '$lib/tools/promptSystem'; 
    import AgentPick from '$components/agents/AgentPick.svelte';
    import { connectionTimer } from '$lib/stores/timer.svelte';
  import { replaceState } from '$app/navigation';

    interface MainChatProps {
        activeChatId?: any;
    }

    let { activeChatId }: MainChatProps = $props(); 

    let chatApiSession: ChatApiSession = new ChatApiSession(activeChatId);

    chatApiSession.initChat(activeChatId);

    let placeholder: string = $derived(chatParamsState.voiceListening ? 'Listening...' : 'Message to ai');

    let disableSubmit: boolean = $derived(chatParamsState.prompt.trim() == '' || chatParamsState.isPrompting || $aiState == 'running');

    async function sendPrompt(chatSession: ChatApiSession, chatParams: ChatGenerate) {
        //
        await chatApiSession.initChat(chatSession.chat.chatId);

        const userChatMessage = await chatSession.createUserChatMessage({ content: chatParams.prompt, images: chatParams.images, model: chatParams.models[0] });
        const userDbMessage = await chatSession.createUserDbMessage({ content: chatParams.prompt, images: chatParams.images, model: chatParams.models[0] });
        
        const chat = chatSession.chat;
      
        //  chatSession get unique userDbMessage with model;
        
        const previousMessages = await chatSession.setPreviousMessages();
        const systemPrompt = chatParams.promptSystem.value; // chat.systemPrompt.content;

        // loop on chatParams.models
        chatParams.models.forEach(async (model: string) => {
            // chatSession create assistantsDbMessage with concerned model;
            const assistantDbMessage = await chatSession.createAssistantMessage(model);
            // get ollamaBody
            const sender = new PromptSender(chat.ollamaBody);
            // declare stream listeners
            sender.onStream = ({ target, data }) => {
                chatSession.onMessageStream(target, data);
                // set auto-scroll to false
                ui.setAutoScroll(target.chatId, false);
            };

            sender.onEnd = ({ data }) => { 
                chatSession.onMessageDone(assistantDbMessage, data);
                aiState.set('done');
                chatMetadata.checkTitle(userDbMessage.chatId);
            };

            sender.sendChatMessage({
                model,
                systemPrompt,
                previousMessages,
                userMessage: userChatMessage,
                target: assistantDbMessage,
                temperature: chatParams.temperature,
                format: chatParams.format,
                context: chat.context ?? [],
            });
        });

        // set auto-scroll to true
        ui.setAutoScroll(chatSession.chat.chatId, true);
    }

    async function submitHandler(chatId: string | undefined, chatParams: ChatGenerate) {
        if (!chatId) {
            await chatApiSession.createChatDbSession({});
            // set active chat
            activeChatId = chatId = chatApiSession.chat.chatId;
            // window.history.replaceState(history.state, '', `/chat/${chatApiSession.chat.chatId}`);
            replaceState( `/chat/${chatApiSession.chat.chatId}`,{});
        }

        await chatApiSession.updateChatSession({
            chatId,
            models: [...chatParams?.models],
            systemPrompt: chatParams.promptSystem,
            ollamaBody: $ollamaBodyStore,
        });

        sendPrompt(chatApiSession, chatParams);
    }

    function keyPressHandler(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitHandler(activeChatId, $state.snapshot(chatParamsState));
            chatParamsState.images = undefined;
            chatParamsState.prompt = '';
        }
    }

    // retrieve model, temperature, format
    $effect(() => {
        chatParamsState.mode = $settings.request_mode;
        chatParamsState.models = [$settings.defaultModel];
    });

</script>

{#snippet input()}
    <div class="chatZone">
    <div class=" ">
        <div class="inputTextarea flex flex-col gap-3 px-3 pt-3 flex-1  ">
                <!-- <Images />
                <hr /> -->
                <div class="flex justify-center absolute -top-10 left-0 w-full">
                    <Speech onEnd={submitHandler} bind:prompt={chatParamsState.prompt} bind:voiceListening={chatParamsState.voiceListening} />
                </div>
                <!-- <hr /> -->
                <div class="flex-1   relative  ">
                <Input
                    disabled={!connectionTimer.connected}
                    onkeypress={keyPressHandler}
                    bind:value={chatParamsState.prompt}
                    bind:requestStop={$aiState}
                    {placeholder}
                    form="prompt-form" />
                    <div class="absolute right-3 h-10  w-10 top-[50%] -mt-5     rounded-full place-content-center flex flex-col">
                        {#if $aiState == 'done'}
                            <button   class="rounded-full border border drop-shadow-lg aspect-ratio-square flex place-content-center"     type="submit" form="prompt-form"  >
                                <Icon icon="mdi:send"  />                   
                            </button>
                        {:else}
                            <button   class="rounded-full border border drop-shadow-lg aspect-ratio-square flex place-content-center"    form="prompt-form" >
                                <Icon icon="mdi:stop" />
                            </button>
                        {/if}                    
                    </div>
                    <!-- <hr /> -->
                </div>
                <div class="flex  ">
                    <ChatOptions />
                    <div class="flex-1"></div>
                </div>
            </div>
        </div>        
        <div class="text-xs text-center theme-bg p-2">{$t('ui.aiCautionMessage')}</div>
    </div>
{/snippet}
<!-- <div class="absolute right-4"><AgentPick /></div> -->
<form hidden id="prompt-form" on:submit|preventDefault={submitHandler} />
<div class="h-full w-full">
    <div class="application-container flex-v h-full mx-auto">
        <DashBoard showList={Boolean(activeChatId)}>
            {#snippet home()}
                {@render input()}
            {/snippet}
            <MessagesList chatId={activeChatId} />
            {@render input()}
        </DashBoard>
    </div>
</div>

<style lang="postcss" global>
hr {
    margin: 0;
}
    .chatZone {
        @apply flex flex-col   w-full sticky mb-0 bottom-0 px-8;
       /*  background-image: var(--cfab-gradient); */
        background-size: 100vh 100vw;
        background-position: bottom; 
        color: var(--cfab-foreground);
    background-color: var(--cfab-bg);
    }
    .inputTextarea { 
        position: relative; 
        &:has(textarea:focus) {
            border-color: var(--cfab-input-border-color-focus, red);
            border-radius: 0.5em;
        }
    }
</style>
