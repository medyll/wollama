<script lang="ts">
	import Icon from '@iconify/svelte';

	export let disabled: boolean = false;
	export let form: string = '';
	export let userFiles: any[] = [];

	let fileinput: HTMLInputElement;

	const onFileSelected = (e: any) => {
		let image = e.target.files[0];
		let reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = (e) => {
			userFiles = [
				...userFiles,
				{
					type: 'image',
					dataUri: e?.target?.result
				}
			];
		};
	};
</script>

<button
	class="borderButton"
	on:click={() => {
		fileinput.click();
	}}
	type="button"
	form="prompt-form"
	{disabled}
>
	<Icon icon="heroicons:paper-clip-solid" style="font-size:1.6em" />
</button>

<input 
	type="file"
	{form}
	accept=".jpg, .jpeg, .png"
	hidden
	on:change={(e) => onFileSelected(e)}
	bind:this={fileinput}
/>
