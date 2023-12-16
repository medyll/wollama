<script lang="ts">
	import { prompter } from '$lib/stores/prompter';
	import { settings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';


    function setTemperature(temperature: number) {
        $prompter.temperature = temperature;
    }
</script>

<div class="p-1 flex justify-center ">
	<div class="p-0.5  flex justify-center gauge relative">
		<div class="absolute -left-10"><Icon icon="mdi:temperature" class="md" /></div>
		{#each Object.keys($settings.temperatures ?? {}) as temperature}
        {@const active = $prompter.temperature == $settings.temperatures[temperature]}
			<button on:click={()=>{setTemperature($settings.temperatures[temperature])}} 
            class:active
            class="button-temp">{temperature}</button>
		{/each}
	</div>
</div>

<style lang="postcss">
	.gauge{
		@apply shadow-gray-950 rounded-md dark:bg-white/10;
	}
	.button-temp {
		@apply rounded-md;
		@apply p-1 px-2;
		&.active {
			@apply bg-gradient-to-tl from-gray-500 to-gray-800 shadow-gray-950;
			@apply text-white;
		}
	}
</style>
