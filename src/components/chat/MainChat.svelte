<script lang="ts">
    import { settings } from '$lib/stores/settings.svelte';
    import Speech from '$components/chat/input/Speech.svelte';
    import Input from './input/Input.svelte';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import ChatOptions from './ChatOptions.svelte';
    import { PromptSender } from '$lib/tools/promptSender.js';
    import { ollamaBodyStore,   } from '$lib/stores/prompter';
    import { aiState } from '$lib/stores';
    import DashBoard from '$components/DashBoard.svelte';
    import Images from './input/Images.svelte';
    import { connectionChecker } from '$lib/stores/connection';
    import { ChatApiSession } from '$lib/tools/chatApiSession';
    import { chatParams, type ChatGenerate } from '$lib/states/chat.svelte';
    import { Button, Icon, IconButton } from '@medyll/slot-ui';
    import MessagesList from './MessagesList.svelte';
    import { chatMetadata } from '$lib/tools/promptSystem';

    interface Props {
        activeChatId?: any;
    }

    let { activeChatId }: Props = $props();
    $inspect(activeChatId);

    let chatApiSession: ChatApiSession = new ChatApiSession(activeChatId);

    chatApiSession.initChat(activeChatId);

    let placeholder: string = $derived(chatParams.voiceListening ? 'Listening...' : 'Message to ai');

    let disableSubmit: boolean = $derived(chatParams.prompt.trim() == '' || chatParams.isPrompting || $aiState == 'running');

    async function sendPrompt(chatSession: ChatApiSession, chatParams: ChatGenerate) {
        //
        const chat = chatSession.chat;
        aiState.set('running');
        //  chatSession get unique userDbMessage with model;
        const userChatMessage = await chatSession.createUserChatMessage({ content: chatParams.prompt, images: chatParams.images, model: chatParams.models[0] });
        const userDbMessage = await chatSession.createUserDbMessage({ content: chatParams.prompt, images: chatParams.images, model: chatParams.models[0] });
        const previousMessages = await chatSession.setPreviousMessages();
        const systemPrompt = chatParams.promptSystem.content; // chat.systemPrompt.content;

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
            window.history.replaceState(history.state, '', `/chat/${chatApiSession.chat.chatId}`); 
        }

        await chatApiSession.updateChatSession({
            chatId,
            models: [...chatParams.models],
            systemPrompt: chatParams.promptSystem,
            ollamaBody: $ollamaBodyStore,
        });

        sendPrompt(chatApiSession, chatParams);
    }

    function keyPressHandler(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitHandler(activeChatId, $state.snapshot(chatParams));
            chatParams.images = undefined;
            chatParams.prompt = '';
        }
    }

    // retrieve model, temperature, format
    $effect(() => {
        chatParams.mode = $settings.request_mode;
        chatParams.models = [$settings.defaultModel];
    });
    $inspect(chatParams.promptSystem);
</script>

{#snippet input()}
    <div class="chatZone">
        <div class="input inputTextarea">
            <Images />
            <div class="flex justify-center absolute -top-10 left-0 w-full">
                <Speech onEnd={submitHandler} bind:prompt={chatParams.prompt} bind:voiceListening={chatParams.voiceListening} />
            </div>
            <Input
                disabled={$connectionChecker.connectionStatus != 'connected'}
                onkeypress={keyPressHandler}
                bind:value={chatParams.prompt}
                bind:requestStop={$aiState}
                {placeholder}
                form="prompt-form" />
            <div class="flex">
                <ChatOptions />
                <div class="flex-1"></div>
                {#if $aiState == 'done'}
                    <IconButton width="tiny" icon="mdi:send" type="submit" form="prompt-form" disabled={disableSubmit} />
                {:else}
                    <IconButton width="tiny" icon="mdi:stop" form="prompt-form" />
                {/if}
            </div>
        </div>
        <div class="text-xs text-center theme-bg p-2">{$t('ui.aiCautionMessage')}</div>
    </div>
{/snippet}
<form hidden id="prompt-form" on:submit|preventDefault={submitHandler} />
<div class="h-full w-full">
    <div class="application-container flex-v h-full mx-auto ">
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
    .chatZone {
        @apply flex flex-col w-full sticky mb-0 bottom-0 px-8;
        /* background-image: var(--cfab-gradient);
        background-size: 100vh 100vw;
        background-position: bottom; */
    }
    .inputTextarea {
        display: block;
        position: relative;
        padding: 00.5rem;
        &:has(textarea:focus) {
            border-color: var(--cfab-input-border-color-focus, red);
            border-radius: 0.5em;
        }
    }
</style>
