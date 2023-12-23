<script lang="ts">
	import { idbQuery } from '$lib/db/dbQuery';
	import { activeModels } from '$lib/stores'; 
	import { settings } from '$lib/stores/settings.js';
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte'; 


	let defaultModelKeys: string[] = []; // $settings.defaultModel

	const changeHandler = (index:number)=>(event: Event) => {
		$activeModels[index] = event?.target?.value; 
	}

	async function loadChatKeys() {
		defaultModelKeys =  await idbQuery.getChat($ui.activeChatId)?.models 
		?? [$settings.defaultModel]
	}

	function addModel(chatId: string)  {
		 
	} 

	$: if($ui?.activeChatId) { 
		loadChatKeys();
	}else{
		loadChatKeys();
	}

</script>
<div class="flex-align-middle flex-wrap gap-2 sticky top-0">
	{#each defaultModelKeys as modelKey, index (index)}
		<div class="flex gap-2">
			<div class="flex-1">
				<select class="naked"   on:change={changeHandler(index)}>
					{#each $settings?.ollamaModels ?? [] as model}
						{@const partial = model.name.split(':')[0]}
						<option selected={model.name === modelKey} value={model.name}
							>{model.name}
						</option>
					{/each}
				</select>
			</div>
		</div>
	{/each}
	<!-- <div>
		<button class="borderButton" 
			on:click={() => {
				 
			}}
		>
			<Icon icon="mdi:add" />
		</button>
	</div> -->
</div>
