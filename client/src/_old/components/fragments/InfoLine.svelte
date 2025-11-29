<script lang="ts">
	let className = '';
	export let title: string | undefined = undefined;
	export let vertical: boolean = false;
	export { className as class };
</script>

{#if $$slots.input && !title}
	<div class="w-full py-2 text-sm font-semibold">
		{title}
	</div>
{/if}
<div class="{vertical ? 'flex-v' : 'flex-align-middle'} gap-4 py-4">
	<div class="flex flex-1 text-sm">
		<div class="flex-1 font-semibold"><slot name="input">- {title}</slot></div>
		<slot name="titleButton" />
	</div>
	<div class="{vertical ? 'px-2' : ''} {className}">
		<slot />
	</div>
</div>
