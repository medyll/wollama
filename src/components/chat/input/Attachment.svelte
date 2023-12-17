<script lang="ts">
	import type { MessageImageType } from '$types/db';
	import Icon from '@iconify/svelte';

	export let disabled: boolean = false;
	export let form: string = '';
	export let userFiles: MessageImageType[] = [];

	let fileinput: HTMLInputElement;

	const onFileSelected = (e: any) => {
		let image = e.target.files[0];
		console.log(e.target.files)
		let reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = (e) => {
			if(e?.target?.result){
			userFiles = [
					...userFiles,
					{
						type: 'image',
						name: image.name,
						header: e?.target?.result?.toString().split(',')[0],
						base64: e?.target?.result?.toString().split(',')[1]
					}
				];
			}
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
