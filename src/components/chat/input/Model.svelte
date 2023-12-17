<script lang="ts">
	import { dbQuery } from '$lib/db/dbQuery';
	import { activeModels } from '$lib/stores'; 
	import { settings } from '$lib/stores/settings.js';
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte'; 

	let chatModelKeys: string[] = [];

	const changeHandler = (index:number)=>(event: Event) => {
		$activeModels[index] = event?.target?.value; 
	}

	async function loadChatKeys() {
		chatModelKeys =  await dbQuery.getChat($ui.activeChatId)?.models 
		?? [$settings.defaultModel]
	}

	function addModel(chatId: string)  {
		 
	}

	loadChatKeys();

	$: if($ui.activeChatId) {
		loadChatKeys();
	}

</script>

<div class="p-1 flex flex-wrap gap-2">
	{#each chatModelKeys as modelKey, index (index)}
		<div class="flex gap-2">
			<div class="flex-1">
				<select class="rounded-md" on:change={changeHandler(index)}>
					{#each $settings?.ollamaModels ?? [] as model}
						{@const partial = model.name.split(':')[0]}
						<option selected={model.name === modelKey} value={model.name}
							>{partial} {modelKey}
						</option>
					{/each}
				</select>
			</div>
		</div>
	{/each}
	<div>
		<button
			on:click={() => {
				 
			}}
		>
			<Icon icon="mdi:add" />
		</button>
	</div>
</div>
