<script lang="ts">
    import Speech from '$components/chat/input/Speech.svelte';
    import Model from '$components/chat/input/Model.svelte';
    import { chatUtils } from '$lib/tools/chatUtils';
    import Icon from '@iconify/svelte';
    import Input from './input/Input.svelte';
    import Attachment from './input/Attachment.svelte';
    import ChatInfo from './ChatInfo.svelte';
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
    import { liveQuery } from 'dexie';
    import Bottomer from '$components/ui/Bottomer.svelte'; 
    import { connectionChecker } from '$lib/stores/connection';
    import { ChatApiSession } from '$lib/tools/chatApiSession';
    import type { OllApiChat } from '$types/ollama';

 
    $: placeholder = $prompter.voiceListening ? 'Listening...' : 'Message to ai';

    $: disableSubmit = $prompter.prompt.trim() == '' || $prompter.isPrompting || $aiState == 'running';

    $: messages = liveQuery(() => ($ui.activeChatId ? idbQuery.getMessages($ui.activeChatId) : []));

    async function sendPrompt(prompter: PrompterType, ollamaBody: OllApiChat) {
        //
        const { images, promptSystem } = { ...prompter };

        // init chatSession
        const chatSession = new ChatApiSession($ui.activeChatId);
        await chatSession.initChatSession({
            models: prompter.models,
            ollamaBody,
        });
        // prompt system, context : usage differs on chatSessionType
        chatSession.setOptions({ systemPrompt: promptSystem, context: chatSession.chat.context ?? [] });
        //
        await chatSession.createSessionMessages(prompter.prompt as string, images);

        // set active chat
        ui.setActiveChatId(chatSession.chat.chatId);

        // set ai state to running
        aiState.set('running');
        //
        const sender = new PromptMaker(chatSession.chat.chatId, ollamaBody);
        // prompt system, context : usage differs on chatSessionType
        sender.setOptions(chatSession.options);

        // listen to sender stream
        sender.onStream = ({ assistantMessage, data }) => {
            chatSession.onMessageStream(assistantMessage, data);
            aiState.set('running');
            // set auto-scroll to false
            ui.setAutoScroll(assistantMessage.chatId, false);
        };
        sender.onEnd = ({ assistantMessage, data }) => {
            chatSession.onMessageDone(assistantMessage, data);
            aiState.set('done');
            chatUtils.checkTitle(assistantMessage.chatId);
        };
        // Send prompt to api per assistant.message
        await chatSession.assistantsDbMessages.forEach(async (assistantMessage) => {
            sender.setRoleAssistant(assistantMessage);
            sender.sendChatMessage(chatSession.userChatMessage);
        });

        // reset prompt
        $prompter.prompt = '';
        $prompter.images = undefined;
        // set auto-scroll to true
        ui.setAutoScroll(chatSession.chat.chatId, true);
        // relocation without navigation
        window.history.replaceState(history.state, '', `/chat/${chatSession.chat.chatId}`);
    }

    function submitHandler() {
        sendPrompt($prompter,$ollamaBodyStore);
    }

    function keyPressHandler(e: KeyboardEvent) {
        $prompter.isPrompting = true;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitHandler();
        }
    }
</script>

<form hidden id="prompt-form" on:submit|preventDefault={submitHandler} />
<div class="h-full w-full">
    <div class="application-container flex-v h-full mx-auto">
        <DashBoard>
            <ChatInfo>
                <Model bind:activeModels={$prompter.models} />
            </ChatInfo>
            <List class="flex flex-col w-full gap-4" data={$messages ?? []} let:item={message}>
                <Message {message} />
            </List>
            <Bottomer />
        </DashBoard>
        <div class="chatZone">
            <ChatOptions />
            <div class="inputTextarea">
                <Images />
                <Input
                    disabled={$connectionChecker.connectionStatus != 'connected'}
                    on:keypress={keyPressHandler}
                    bind:value={$prompter.prompt}
                    bind:requestStop={$aiState}
                    showCancel={$aiState == 'running'}
                    {placeholder}
                    form="prompt-form"
                >
                    <Attachment slot="start" form="prompt-form" bind:imageFile={$prompter.images} disabled={false} />
                    <div slot="end" class="flex-align-middle">
                        <Speech onEnd={submitHandler} bind:prompt={$prompter.prompt} bind:voiceListening={$prompter.voiceListening} disabled={disableSubmit} />
                        <button class="px-2" type="submit" form="prompt-form" disabled={disableSubmit}>
                            <Icon icon="mdi:send" style="font-size:1.6em" />
                        </button>
                    </div>
                </Input>
            </div>
            <div class="text-xs text-center theme-bg p-2">{$t('ui.aiCautionMessage')}</div>
        </div>
    </div>
</div>

<style lang="postcss" global>
    .chatZone {
        @apply flex flex-col w-full sticky mb-0 bottom-0 px-8;
        background-image: var(--cfab-gradient);
        background-size: 100vh 100vw;
        background-position: bottom;
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
