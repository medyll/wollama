<script lang="ts">
	import type { MessageImageType } from '$types/db';
	import Icon from '@iconify/svelte';

	export let disabled: boolean = false;
	export let form: string = '';
	export let imageFile: MessageImageType | undefined;

	let fileinput: HTMLInputElement;

	const onFileSelected = (e: any) => {
		let image = e.target.files[0];
		let reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = (e) => {
			if (e?.target?.result) {
				imageFile = {
					base64: e?.target?.result?.toString().split(',')[1],
					dataUri: e?.target?.result?.toString(),
					header: e?.target?.result?.toString().split(',')[0],
					name: image.name,
					type: 'image'
				};
			}
		};
	};
</script>

<button
	on:click={() => {
		fileinput.click();
	}}
	type="button"
	form="prompt-form"
	class="mx-auto"
	{disabled}
>
	<Icon icon="heroicons:paper-clip-solid" style="font-size:1.6em" />
</button>

<input type="file" {form} accept=".jpg, .jpeg, .png" hidden on:change={(e) => onFileSelected(e)} bind:this={fileinput} />
