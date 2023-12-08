
<script lang="ts">

export let prompt: string = '';
export let placeholder: string = '';
export let form: string = '';

</script>

<textarea
    class="flex-1 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none py-3 px-2 resize-none"
    {placeholder}
    bind:value={prompt}
    on:keypress 
    rows="1"
    form={form}
/>