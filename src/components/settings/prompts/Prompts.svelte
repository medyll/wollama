<script lang="ts">
    import Selector from '$components/fragments/Selector.svelte';
    import Confirm from '$components/fragments/Confirm.svelte';
    import { idbQuery } from '$lib/db/dbQuery';
    import { t } from '$lib/stores/i18n';
    import type { PromptType } from '$types/db.js'; 
    import Icon from '@iconify/svelte';
    import { ui } from '$lib/stores/ui';
    import { clickAway } from '$lib/tools/clickAwayt';
    import Frame from '$components/fragments/Frame.svelte';
    import PromptForm from './PromptForm.svelte';
 

    let  { prompt, activePrompt } = $props();

    let promptList = $derived(idbQuery.getPrompts());
    let mode: 'list' | 'create' = $state('list');
    let editMode: boolean = $state(false);

    let element: HTMLElement;

	$effect(() => {
		if (activePrompt) {
			prompt = activePrompt.content;
		}
	});

    async function createPrompt(event: FormDataEvent) {
        const { title, content, id } = event.currentTarget as HTMLFormElement;
        const promptInsert = {};

        const prompt: Partial<PromptType> = {
            content: content.value,
            createdAt: new Date(),
            title: title.value,
        };

        if (id.value) {
            await idbQuery.updatePrompt(eval(id.value), prompt);
            activePrompt = (await idbQuery.getPrompt(eval(id.value))) ?? activePrompt;
            editMode = false;
        }

        if (!id.value) {
            const promptInsert = await idbQuery.insertPrompt(prompt);
            mode = 'list';
            activePrompt = promptInsert;
        }
    }

    function deletePrompt(prompt: PromptType) {
        idbQuery.deletePrompt(prompt.id);
    }

    function loadPrompt(prompt: PromptType) {
        activePrompt = prompt;
    }





</script>

<div bind:this={element} use:clickAway on:clickAway={() => ui.showHidePromptMenu(false)} class="promptZone flex-col flex theme-bg theme-border">
    <div class="flex-1 relative">
        <Frame showPanel={mode == 'list'}>
            <div slot="leftNav" class="flex flex-col gap-2 h-full">
                <div class="soft-title">{$t(`prompt.promptsList`)}</div>
                <Selector value={activePrompt} values={promptList ?? []} let:item>
                    <div class="flex-align-middle py-1">
                        <Confirm
                            validate={() => {
                                deletePrompt(item);
                            }}>
                            <button slot="initial" on:click={() => loadPrompt(item)} class="w-full flex-1 active text-left text-ellipsis overflow-hidden">
                                - {item.title}
                            </button>
                            <Icon icon="mdi:trash" />
                        </Confirm>
                    </div>
                    <div slot="selectorFallback" class="col-gap-2 flex-1">
                        <div class="soft-title">{$t('prompt.emptyList')}</div>
                        <div class="flex-1 flex justify-center items-center place-content-center">
                            <button class="btn btn-big btn-link p-8 px-8 text-center" on:click={() => (mode = 'create')}>
                                <Icon icon="mdi:create" class="inline lg" />
                            </button>
                        </div>
                    </div>
                </Selector>
            </div>
            {#if activePrompt?.title}
                <div class="line-gap-2">
                    <div class=" ">{activePrompt?.title ?? ''}</div>
                    <div class="flex-1"></div>
                    <div class="line-gap-2">
                        {#if editMode}
                            <button form="prompts-form" type="submit" class="btn">
                                {$t('prompt.save')}
                            </button>
                        {/if}
                        <button
                            on:click={() => {
                                editMode = !editMode;
                            }}
                            class="btn btn-link">
                            {!editMode ? $t('prompt.modify') : $t('prompt.cancel')}
                        </button>
                    </div>
                </div>
                <hr />
            {/if}
            <div class="text-left h-full">
                {#if !editMode}
                    {activePrompt?.content ?? ''}
                {/if}
                {#if editMode || mode == 'create'}
                    <div class="col-gap-2 h-full">
                        <PromptForm formName="prompts-form" onSubmit={createPrompt} formData={mode == 'create' ? {} : activePrompt} />
                    </div>
                {/if}
            </div>
        </Frame>
    </div>
    <hr />
    <div class="flex-align-middle gap-8 p-2">
        <Selector values={['list', 'create']} value={mode} let:item>
            <button class="px-2 m-1" type="button" on:click={() => (mode = item)}><Icon icon="mdi:list" /> {item}</button>
        </Selector>
        <div class="flex-1"></div>
        <div class="soft-title">{$t('prompt.promptCenter')}</div>
    </div>
</div>

<style style="postcss">
    .promptZone {
        @apply absolute z-50 bottom-20  p-4 shadow-md rounded-md;
        background-color: var(--cfab-bg-opacity-90);
        backdrop-filter: blur(3px);
    }
</style>
