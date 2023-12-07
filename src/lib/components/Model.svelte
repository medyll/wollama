<script lang="ts">
	import { activeChatId, chatList } from '$lib/stores/chatList';
	import { settings } from '$lib/stores/settings.js';
	import Icon from '@iconify/svelte';


	function changeHandler(event: Event) {
		console.log(event.target);
	}

	function addModel(chatId: string) {
		// add model to chat
		chatList.updateChat(chatId, { models: [] });
	}

	// chatId models
	$: chatModelKeys = chatList.getChat($activeChatId)?.models ?? [$settings.defaultModel];

	$: console.log(chatList.getChat($activeChatId));
</script>

<div class="p-3 flex flex-wrap gap-2">
	<div>
		<button on:click={()=>{addModel(activeChatId)}}>
			<Icon icon="mdi:add" />
		</button>
	</div>
	{#each chatModelKeys as modelKey}
		<div class="flex gap-2">
			<div class="flex-1">
				<select>
					{#each $settings?.models ?? [] as model}
						{@const partial = model.name.split(':')[0]}
						<option selected={partial === modelKey} value={model.name}>{model.name}</option>
					{/each}
				</select>
			</div>
		</div>
	{/each}
</div>
