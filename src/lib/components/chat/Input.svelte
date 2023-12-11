<script lang="ts">
	export let prompt: string = '';
	export let placeholder: string = '';
	export let form: string = '';
	export let disabled: boolean = false;
</script>

<div class="relative flex-align-middle">
	<div class="sides"><slot name="start" /></div>
	<textarea {disabled} {form} {placeholder} bind:value={prompt} on:keypress rows="1" />
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
