<script lang="ts">
    import { settings } from '$lib/stores/settings.svelte';
    import Speech from '$components/chat/input/Speech.svelte';
    import Input from './input/Input.svelte';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import ChatOptions from './ChatOptions.svelte';
    import { ollamaBodyStore } from '$lib/stores/prompter';
    import { aiState } from '$lib/stores';
    import DashBoard from '$components/DashBoard.svelte';
    import { ChatApiSession } from '$lib/tools/chatApiSession';
    import { chatParamsState, type ChatGenerate } from '$lib/states/chat.svelte';
    import { Icon } from '@medyll/idae-slotui-svelte';
    import MessagesList from './MessagesList.svelte';
    import { chatMetadata } from '$lib/tools/promptSystem'; 
    import { connectionTimer } from '$lib/stores/timer.svelte';
    import { replaceState } from '$app/navigation';
    import type { DBMessage } from '$types/db';
    import { WollamaApi } from '$lib/db/wollamaApi';
    import { get } from 'svelte/store';
    import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';
    import type { GenerateRequest } from 'ollama/browser';
    import { ChatSessionManager } from '$lib/tools/chatSessionManager';
    
    interface MainChatProps {
        activeChatId?: any;
    }

    let { activeChatId }: MainChatProps = $props(); 

    let chatApiSession: ChatApiSession = new ChatApiSession(activeChatId);
    chatApiSession.initChat(activeChatId);


    let chatSessionManager: ChatSessionManager =   ChatSessionManager.loadSession(); 
    


    let placeholder: string = $derived(chatParamsState.voiceListening ? 'Listening...' : 'Message to ai');

    let disableSubmit: boolean = $derived(chatParamsState.prompt.trim() == '' || chatParamsState.isPrompting || $aiState == 'running');

    async function sendPrompt(chatSession: ChatApiSession, chatParams: ChatGenerate) {
        //
        await chatApiSession.initChat(chatSession.chat.chatId);

        const chat = chatSession.chat;
      
        //  chatSession get unique userDbMessage with model;
        const previousMessages = await chatSession.setPreviousMessages();
        const systemPrompt = chatParams.promptSystem.value; // chat.systemPrompt.content;

        let assistantDbMessage:DBMessage;
        // loop on chatParams.models
        chatParams.models.forEach(async (model: string) => {
            // chatSession create assistantsDbMessage with concerned model;
            const userChatMessage = await chatSession.createUserChatMessage({ content: chatParams.prompt, images: chatParams.images, model: chatParams.models[0] });
            const userDbMessage = await chatSession.createUserDbMessage({ content: chatParams.prompt, images: chatParams.images, model: chatParams.models[0] });
            
            assistantDbMessage = assistantDbMessage ?? await chatSession.createAssistantMessage(model);

            const config = get(settings);
            const ollamaOptions = get(ollamaApiMainOptionsParams);
            
            const request =  {
                    prompt: userChatMessage.content,
                    system: `${systemPrompt ?? config?.system_prompt}`,
                    context : chat.context ?? [],
                    model: model ?? config?.defaultModel,
                    options: { ...ollamaOptions,  temperature: chatParams.temperature, },
                    format:  chatParams.format ,
                    stream: true,
                } satisfies GenerateRequest ;


            const senderGenerate =  WollamaApi.generate_bis(                
                request // pass the request object here
            )

            senderGenerate.onStream = (response) => {
                const target = assistantDbMessage; 
                console.log('sender.onStream', { target, response });
                chatSession.onMessageStream(target, response);
                ui.setAutoScroll(target.chatId, false);  
            };

            senderGenerate.onEnd = (response) => { 
                console.log('senderGenerate.onEnd', { response });
                chatSession.onMessageDone(assistantDbMessage, response); // Updated to use response instead of data
                aiState.set('done');
                chatMetadata.checkTitle(userDbMessage.chatId);
            };




           
        });

        // set auto-scroll to true
        ui.setAutoScroll(chatSession.chat.chatId, true);
    }

    async function submitHandler(chatId: string | undefined, chatParams: ChatGenerate) {
        if (!chatId) {
            await chatApiSession.createChatDbSession({});
            // set active chat
            activeChatId = chatId = chatApiSession.chat.chatId;
            window.history.replaceState(history.state, '', `/chat/${chatApiSession.chat.chatId}`); 
            // replaceState( `/chat/${chatApiSession.chat.chatId}`,page.params);
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
                            <button   class="rounded-full border border drop-shadow-lg aspect-square flex place-content-center"     type="submit" form="prompt-form"  >
                                <Icon icon="mdi:send"  />                   
                            </button>
                        {:else}
                            <button   class="rounded-full border border drop-shadow-lg aspect-square flex place-content-center"    form="prompt-form" >
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

<style lang="postcss">
    @reference "../../styles/all.css";
    hr {
        margin: 0;
    }
    .chatZone {
        @apply flex flex-col;
        @apply    w-full sticky mb-0 bottom-0 px-8;
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
