<script lang="ts">
	import { activeChat, activeChatId, chatter } from '$lib/stores/chatter';
	import { settings } from '$lib/stores/settings.js';
	import Icon from '@iconify/svelte';

	function changeHandler(event: Event) {
		console.log(event.target.value);
		chatter.updateChat($activeChatId, { models: [event.target.value] });
	}

	function addModel(chatId: string) {
		chatter.updateChat(chatId, { models: [] });
	}

	$: chatModelKeys = chatter.getChat($activeChatId)?.models ?? [$settings.defaultModel];

	$: console.log($activeChat);
</script>

<div class="p-3 flex flex-wrap gap-2">
	<div>
		<button
			on:click={() => {
				addModel(activeChatId);
			}}
		>
			<Icon icon="mdi:add" />
		</button>
	</div>
	{#each chatModelKeys as modelKey}
		<div class="flex gap-2">
			<div class="flex-1">
				<select on:change={changeHandler}>
					{#each $settings?.ollamaModels ?? [] as model}
						{@const partial = model.name.split(':')[0]}
						<option selected={partial === modelKey} value={model.name}>{model.name}</option>
					{/each}
				</select>
			</div>
		</div>
	{/each}
</div>
