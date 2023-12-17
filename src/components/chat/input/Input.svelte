<script lang="ts">
	import { timeRetry } from "$lib/stores/timeRetry";

	export let value: string = '';
	export let placeholder: string = '';
	export let form: string = '';
	export let disabled: boolean = $timeRetry.connectionStatus == 'error';
</script>

<div class="relative flex-align-middle">
	<div class="sides"><slot name="start" /></div>
	<textarea {disabled} {form} {placeholder} bind:value  on:keypress rows="1" />
	<div class="sides absolute h-full right-0"><slot name="end" /></div>
</div>

<style lang="postcss">
	textarea {
		@apply w-full flex-1 block outline-none py-3 px-2 resize-none;
	}
	.sides {
		@apply flex flex-row ;
	}
</style>
