<script lang="ts">

export let title: string= ''; 
export let vertical: boolean = false;


$$slots.input
</script>

{#if $$slots.input && title!=''}
    <div class="w-full font-semibold py-2">		
        {title}
    </div>
{/if}
<div class="flex {vertical? 'flex-col': 'place-items-center'} gap-2 ">
	<div class="flex-1 font-semibold py-2">		
        <slot name="input">{title}</slot>
	</div>
	<div class="{vertical? 'px-2':''}">
		<slot></slot>
	</div>
</div>