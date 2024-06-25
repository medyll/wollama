<svelte:options accessors runes />

<script lang="ts">
    import Speech from '$components/chat/input/Speech.svelte'; 
    import { chatUtils } from '$lib/tools/chatUtils';
    import Icon from '@iconify/svelte';
    import Input from './input/Input.svelte';
    import Attachment from './input/Attachment.svelte'; 
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import ChatOptions from './ChatOptions.svelte';
    import { PromptMaker } from '$lib/tools/promptSender.js';
    import { idbQuery } from '$lib/db/dbQuery.js';
    import { ollamaBodyStore, prompter, type PrompterType } from '$lib/stores/prompter';
    import { aiState } from '$lib/stores';
    import Message from '$components/chat/Message.svelte';
    import DashBoard from '$components/DashBoard.svelte';
    import Images from './input/Images.svelte';
    import List from '$components/fragments/List.svelte'; 
    import { connectionChecker } from '$lib/stores/connection';
    import { ChatApiSession } from '$lib/tools/chatApiSession';
    import type { OllamaChat } from '$types/ollama'; 
    import { chatParams } from '$lib/states/chat.svelte'; 

    $effect(() => {
        // $inspect(idbqlState.chat.where({ chatId: { eq: 'red' } }));
    });

    let chatApiSession: ChatApiSession = new ChatApiSession($ui.activeChatId);

    let placeholder: string = $derived(chatParams.voiceListening ? 'Listening...' : 'Message to ai');

    let disableSubmit: boolean = $derived($prompter.prompt.trim() == '' || $prompter.isPrompting || $aiState == 'running');

    let messages = $derived($ui.activeChatId ? idbQuery.getMessages($ui.activeChatId) : []);

    async function sendPrompt(prompter: PrompterType, ollamaChatBody: OllamaChat, chatSession: ChatApiSession) {
        //
        const { images, promptSystem } = { ...prompter };
        //

        aiState.set('running');
        //  chatSession get unique userDbMessage with model;
        const userChatMessage = await chatSession.createUserChatMessage({ content: chatParams.prompt, images, model: chatParams.models[0] });
        const userDbMessage = await chatSession.createUserDbMessage({ content: chatParams.prompt, images, model: chatParams.models[0] });
        const previousMessages = chatSession.previousMessages;
        const systemPrompt = promptSystem.content;
        
        // loop on chatParams.models
        chatParams.models.forEach(async (model: string) => {
            // chatSession create assistantsDbMessage with concerned model;
            const assistantDbMessage = await chatSession.createAssistantMessage(model);
            // get ollamaBody
            const sender = new PromptMaker(ollamaChatBody);
            // declare stream listeners
            sender.onStream = ({ target, data }) => {
                chatSession.onMessageStream(target, data);
                // set auto-scroll to false
                ui.setAutoScroll(target.chatId, false);
            };
            sender.onEnd = ({ data }) => {
                chatSession.onMessageDone(assistantDbMessage, data);
                aiState.set('done');
                chatUtils.checkTitle(userDbMessage.chatId);
            };
            // send
            sender.setRoleAssistant(assistantDbMessage);
            sender.sendChatMessage({
                model,
                previousMessages,
                ollamaChatBody,
                systemPrompt,
                userMessage: userChatMessage,
                target: assistantDbMessage,
            });
        });

        chatParams.images = undefined;

        // $prompter.prompt = '';
        chatParams.prompt = '';
        chatParams.images = undefined;

        // set auto-scroll to true
        ui.setAutoScroll(chatSession.chat.chatId, true);
    }

    async function submitHandler() {
        if (!$ui.activeChatId) {
            await chatApiSession.initChatSession({
                models: [...chatParams.models],
            });
            // set active chat
            ui.setActiveChatId(chatApiSession.chat.chatId);
            // relocation without navigation
            window.history.replaceState(history.state, '', `/chat/${chatApiSession.chat.chatId}`);
        }

        await chatApiSession.updateChatSession({
            models: [...chatParams.models],
            systemPrompt: { ...chatParams.promptSystem },
            ollamaBody: $ollamaBodyStore,
        });

        sendPrompt($prompter, $ollamaBodyStore, chatApiSession);
    }

    function keyPressHandler(e: KeyboardEvent) {
        chatParams.isPrompting = true;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitHandler();
        }
    }

    /* const response =   fetch('/api/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url:'red' }),
    }); */
</script>

{#snippet input()}
    <div class="chatZone">
        <ChatOptions />
        <div class="inputTextarea">
            <Images />
            <Input
                disabled={$connectionChecker.connectionStatus != 'connected'}
                onkeypress={keyPressHandler}
                bind:value={chatParams.prompt}
                bind:requestStop={$aiState}
                showCancel={$aiState == 'running'}
                {placeholder}
                form="prompt-form">
                <Attachment slot="start" form="prompt-form" bind:imageFile={chatParams.images} disabled={false} />
                <div slot="end" class="flex-align-middle">
                    <Speech onEnd={submitHandler} bind:prompt={chatParams.prompt} bind:voiceListening={chatParams.voiceListening} disabled={disableSubmit} />
                    <button class="px-2" type="submit" form="prompt-form" disabled={disableSubmit}>
                        <Icon icon="mdi:send" style="font-size:1.6em" />
                    </button>
                </div>
            </Input>
        </div>
        <div class="text-xs text-center theme-bg p-2">{$t('ui.aiCautionMessage')}</div>
    </div>
{/snippet}
<form hidden id="prompt-form" on:submit|preventDefault={submitHandler} />
<div class="h-full w-full">
    <div class="application-container flex-v h-full mx-auto">
        <DashBoard>
            {#snippet home()}
                {@render input()}
            {/snippet}
            <List class="flex flex-col w-full gap-4 flex-1" data={messages ?? []} let:item={message}>
                <Message messageId={message.messageId} />
            </List>
            {@render input()}
            <!-- <Bottomer /> -->
        </DashBoard>
    </div>
</div>

<style lang="postcss" global>
    .chatZone {
        @apply flex flex-col w-full sticky mb-0 bottom-0 px-8; 
        /*  background-image: var(--cfab-gradient);
        background-size: 100vh 100vw;
        background-position: bottom; */
    }
    .inputTextarea {
        border-color: transparent;
        border-width: 1px;
        &:has(textarea:focus) {
            border-color: var(--cfab-input-border-color-focus);
            border-radius: 1em;
        }
    }
</style>
