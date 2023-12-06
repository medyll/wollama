<script lang="ts">
	import { activeChatId, chatList } from '$lib/stores/chatList';
	import { settings } from '$lib/stores/settings.js';

	//const chatModelsKeys = $settings?.chatModelKeys ?? [1, 2];

	function changeHandler(event: Event) {
		console.log(event.target);
	}

	// chatId models
	$: chatModelKeys = chatList.getChat($activeChatId)?.models ?? [$settings.defaultModel];

	$: console.log(chatList.getChat($activeChatId));
</script>

<div class="p-3 flex flex-wrap gap-2">
	{#each chatModelKeys as modelKey}
		<div>
			<select>
				{#each $settings?.models ?? [] as model}
					{@const partial = model.name.split(':')[0]} 
					<option selected={partial === modelKey} value={model.name}>{model.name}</option>
				{/each}
			</select>
		</div>
	{/each}
</div>
