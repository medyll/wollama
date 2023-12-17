<script lang="ts">
	import { timeRetry } from '$lib/stores/timeRetry';
	import Icon from '@iconify/svelte';

	export let value: string = '';
	export let placeholder: string = '';
	export let form: string = '';
	export let disabled: boolean = $timeRetry.connectionStatus == 'error';
	export let showCancel: boolean = false;

	export let requestStop:string;

	export let onsubmit = (e: Event) => requestStop='request_stop';
</script>

<div class="relative flex-align-middle">
	<div class="sides"><slot name="start" /></div>
	<textarea {disabled} {form} {placeholder} bind:value on:keypress rows="1" />
	<div class="sides absolute h-full right-0">
		{#if showCancel}
			<button  class="w-12"
				on:click={onsubmit}
				type="button"
				{disabled}
			>
				<Icon icon="mdi:stop" class="md" />
			</button>
		{:else}
			<slot name="end" />
		{/if}
	</div>
</div>

<style lang="postcss">
	textarea {
		@apply w-full flex-1 block outline-none py-3 px-2 resize-none;
	}
	.sides {
		@apply flex flex-row;
	}
</style>
