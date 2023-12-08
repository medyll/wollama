<script lang="ts">
	export let prompt: string = '';
	export let placeholder: string = '';
	export let form: string = '';
</script>

<textarea
	{form}
	{placeholder}
	bind:value={prompt}
	on:keypress
	rows="1"
/>

<style lang="postcss">
	textarea {
		@apply flex-1  outline-none py-3 px-2 resize-none;
	}
</style>
