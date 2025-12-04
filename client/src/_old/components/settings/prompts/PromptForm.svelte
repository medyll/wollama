<script lang="ts">
	export let formData: Record<string, any> = {};
	export let formName: string;

	export let onSubmit = (event: FormDataEvent) => {
		console.log('onSubmit', event);
		//createPrompt(event);
	};
</script>

<form
	id="prompts-form"
	on:submit|preventDefault={(event) => {
		onSubmit(event);
	}}
/>
<input form={formName} value={formData?.id ?? ''} type="hidden" name="id" />
<input required form={formName} name="title" type="text" class="w-96" placeholder="prompt title" value={formData?.title ?? ''} />
<textarea
	required
	form={formName}
	rows="3"
	name="content"
	type="text"
	class="h-96 w-full flex-1 rounded-md"
	placeholder="prompt content"
>
	{formData?.content ?? ''}
</textarea>
