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
    import { PromptSender } from '$lib/tools/promptSender.js';
    import { idbQuery } from '$lib/db/dbQuery.js';
    import { prompter, type PrompterType } from '$lib/stores/prompter';
    import { aiState } from '$lib/stores';
    import Message from '$components/chat/Message.svelte';
    import DashBoard from '$components/DashBoard.svelte';
    import Images from './input/Images.svelte';
    import List from '$components/fragments/List.svelte';
    import { liveQuery } from 'dexie';
    import Bottomer from '$components/ui/Bottomer.svelte';
    import { ollamaParams } from '$lib/stores/ollamaParams';
    import { connectionChecker } from '$lib/stores/connection';
    import { ChatSession } from '$lib/tools/chatSession';

    $: placeholder = $prompter.voiceListening ? 'Listening...' : 'Message to ai';

    $: disableSubmit = $prompter.ollamaBody.prompt.trim() == '' || $prompter.isPrompting || $aiState == 'running';

    $: messages = liveQuery(() => ($ui.activeChatId ? idbQuery.getMessages($ui.activeChatId) : []));

    async function sendPrompt(prompter: PrompterType) {
        const { ollamaBody, images, promptData } = { ...prompter }; // clear reference

        // init chatSession
        const chatSession = new ChatSession($ui.activeChatId);
        await chatSession.setChatData({
            models: prompter.models,
            ollamaBody: prompter.ollamaBody,
        });
        // 
        await chatSession.createUserMessages(ollamaBody.prompt as string, images);
        // set active chat
        ui.setActiveChatId(chatSession.chat.chatId);

        // set default options
        ollamaBody.options = { ...$ollamaParams, ...ollamaBody.options };
        ollamaBody.format = ollamaBody.format?.replace('plain', '');
        ollamaBody.system = promptData.content ?? '';
        ollamaBody.context = chatSession.chat.context ?? [];

        // set ai state to running
        aiState.set('running');
        //
        const sender = new PromptSender(chatSession.chat.chatId, ollamaBody);
		// listen to sender stream
        sender.onStream = ({ assistantMessage, data }) => {
            chatSession.onMessageStream(assistantMessage, data);
            aiState.set('running');
            //
            chatUtils.checkTitle(assistantMessage.chatId);
            // set auto-scroll to false
            ui.setAutoScroll(assistantMessage.chatId, false);
        };
        sender.onEnd = ({ assistantMessage, data }) => {
            chatSession.onMessageDone(assistantMessage, data);
            aiState.set('done');
        };
        // create prompt sender for each model
        await chatSession.assistants.forEach(async (assistantMessage) => {
            sender.setRoleAssistant(assistantMessage);
            sender.sendChatMessage(chatSession.userMessage);
        });

        // reset prompt
        $prompter.ollamaBody.prompt = '';
        $prompter.images = undefined;
        // set auto-scroll to true
        ui.setAutoScroll(chatSession.chat.chatId, true);
        // relocation without navigation
        window.history.replaceState(history.state, '', `/chat/${chatSession.chat.chatId}`);
    }

    function submitHandler() {
        sendPrompt($prompter);
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
            <List class="flex-v w-full gap-4" data={($messages?? [])} let:item={message}>
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
                    bind:value={$prompter.ollamaBody.prompt}
                    bind:requestStop={$aiState}
                    showCancel={$aiState == 'running'}
                    {placeholder}
                    form="prompt-form"
                >
                    <Attachment slot="start" form="prompt-form" bind:imageFile={$prompter.images} disabled={false} />
                    <div slot="end" class="flex-align-middle">
                        <Speech
                            onEnd={submitHandler}
                            bind:prompt={$prompter.ollamaBody.prompt}
                            bind:voiceListening={$prompter.voiceListening}
                            disabled={disableSubmit}
                        />
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
