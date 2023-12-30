<script lang="ts">
	import List from '$components/fragments/List.svelte';
	import Selector from '$components/fragments/Selector.svelte';
	import Confirm from '$components/fragments/Confirm.svelte';
	import { idbQuery } from '$lib/db/dbQuery';
	import { t } from '$lib/stores/i18n';
	import type { PromptType } from '$types/db.js';
	import { liveQuery } from 'dexie';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { ui } from '$lib/stores/ui';
	import { clickAway } from '$lib/tools/clickAwayt';

	let promptList = liveQuery(() => idbQuery.getPrompts());
	let mode: 'list' | 'create' = 'list';
	let activePrompt: PromptType;

	let element: HTMLElement;

	onMount(() => {});

	async function createPrompt(event: SubmitEvent) {
		const { title, content } = event.target as HTMLFormElement;
		const prompt: Partial<PromptType> = {
			title: title.value,
			content: content.value,
			createdAt: new Date()
		};

		await idbQuery.insertPrompt(prompt);
	}

	function deletePrompt(prompt: PromptType) {
		idbQuery.deletePrompt(prompt.id);
	}
</script>

<div
	bind:this={element}
	use:clickAway
	on:clickAway={() => ui.showHidePromptMenu(false)}
	class="promptZone flex-col flex"
>
	<div class="flex-1">
		{#if mode == 'list'}
			<div class="flex gap-4 h-96">
				<div class="w-48 paper overflow-auto">
					<List class="flex flex-col gap-4" data={$promptList ?? []} let:item>
						<button
							on:click={() => ui.showHideMenu()}
							class="w-full active text-left text-ellipsis overflow-hidden"
						>
							- {item.title}
						</button>
						<Confirm
							validate={() => {
								deletePrompt(item);
							}}><Icon icon="mdi:trash" /></Confirm
						>
					</List>
				</div>
				<div class="w-96">
					<div class="p-2">{activePrompt?.title ?? ''}</div>
					{#if activePrompt?.title}<hr />{/if}
					<div class="p-2">{activePrompt?.content ?? ''}</div>
				</div>
			</div>
		{:else if mode == 'create'}
			<div class="flex flex-col gap-4">
				<form
					id="prompts-form"
					on:submit|preventDefault={(event) => {
						createPrompt(event);
					}}
				/>
				<input form="prompts-form" type="hidden" name="id" />
				<div class="flex-align-middle gap-4">
					<label for="title" class="w-32">
						{$t('prompt.title')}
					</label>
					<input
						required
						form="prompts-form"
						name="title"
						type="text"
						class="w-96"
						placeholder="prompt title"
						value=""
					/>
				</div>
				<div class="flex gap-4">
					<label for="content" class="w-32">
						{$t('prompt.content')}
					</label>
					<textarea
						required
						form="prompts-form"
						rows="3"
						name="content"
						type="text"
						class="w-96 h-48 rounded-md"
						placeholder="prompt content"
					>
					</textarea>
				</div>
				<div class="text-right">
					<button class="btn" form="prompts-form" type="submit">{$t('prompt.createPrompt')}</button>
				</div>
			</div>
		{/if}
	</div>

	<hr />

	<div class="flex-align-middle gap-8">
		<Selector values={['list', 'create']} value={mode} let:item>
			<button type="button" on:click={() => (mode = item)}><Icon icon="mdi:list" /> {item}</button>
		</Selector>
		<div class="flex-1"></div>
		<div class="soft-title">{$t('prompt.promptCenter')}</div>
	</div>
</div>

<style style="postcss">
	.promptZone {
		@apply fixed z-30 bottom-24 theme-bg p-4 theme-border shadow-md rounded-md;
	}
</style>
