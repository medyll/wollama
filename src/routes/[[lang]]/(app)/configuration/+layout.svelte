<script lang="ts">
	import Selector from '$components/fragments/Selector.svelte';
	import Advanced from '$components/settings/mdl/Advanced.svelte';
	import { engine } from '$lib/tools/engine';

	const tabs = ['ollama','model','home',];	

	let activeTab = 'ollama';
</script>

<div class="container h-full w-full flex-col">
	<div class="p-2 flex-align-middle gap-8">
		<Selector value={activeTab} values={tabs} let:item>
			<button on:click={()=>{engine.goto(`/configuration/${item}`)}}>{item}</button>
		</Selector>
	</div>
	<div>
		<slot >
        <Advanced />
        </slot>
	</div>
</div>
